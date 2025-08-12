import { NextResponse } from "next/server";

interface AnalyzeRequestBody {
  content: string;
  sentences?: string[];
  maxVocab?: number;
  maxGrammar?: number;
}

interface VocabEntry {
  surfaceForm: string; // Original word or kanji as in text
  reading?: string; // Kana reading (furigana)
  lemma?: string; // Dictionary/base form
  meaningVi: string; // Vietnamese meaning
  partOfSpeech?: string; // e.g., 名詞, 動詞
  jlpt?: string; // e.g., N5-N1 if applicable
  examples?: Array<{ jp: string; vi: string }>;
}

interface GrammarEntry {
  pattern: string; // Grammar pattern as it appears in text
  explanationVi: string; // Vietnamese explanation
  usage?: string; // Notes on usage/nuance
  examples?: Array<{ jp: string; vi: string }>;
}

interface AnalyzeResult {
  vocab: VocabEntry[];
  grammar: GrammarEntry[];
}

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const GEMINI_API_BASE = process.env.GOOGLE_GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = process.env.GOOGLE_GEMINI_MODEL || "gemini-1.5-flash";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AnalyzeRequestBody;
    console.log("/api/ai/analyze request body:", body);

    if (!body || !body.content || body.content.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Missing 'content' in request body" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: "Server is missing GOOGLE_GEMINI_API_KEY" }, { status: 500 });
    }

    const maxVocab = Math.min(Math.max(body.maxVocab ?? 25, 5), 60); // clamp 5..60
    const maxGrammar = Math.min(Math.max(body.maxGrammar ?? 10, 0), 30); // clamp 0..30

    const sentencesJoined = Array.isArray(body.sentences) && body.sentences.length > 0 ? body.sentences.join("\n") : "";

    const systemPrompt =
      `Bạn là trợ lý dạy tiếng Nhật cho người Việt.\n` +
      `Đầu ra phải là JSON hợp lệ, KHÔNG kèm giải thích, KHÔNG markdown.\n` +
      `Hãy trích xuất từ vựng (kanji/từ) và ngữ pháp quan trọng từ bài báo tiếng Nhật.\n` +
      `Chỉ chọn những mục đáng học (tránh từ quá cơ bản, filler).\n` +
      `Mỗi mục có ví dụ chuẩn xác, ngắn gọn, lịch sự, và bản dịch tiếng Việt tự nhiên.`;

    const userText =
      `Bài tiếng Nhật:\n` +
      `-----\n` +
      `${body.content}\n` +
      `-----\n` +
      (sentencesJoined ? `Câu đã tách (tham khảo):\n${sentencesJoined}\n` : "") +
      `\nYêu cầu:\n` +
      `1) Tạo danh sách từ vựng (vocab) tối đa ${maxVocab} mục.\n` +
      `   - surfaceForm: dạng xuất hiện trong bài\n` +
      `   - reading: cách đọc (kana), nếu có\n` +
      `   - lemma: dạng từ điển (nếu khác)\n` +
      `   - meaningVi: nghĩa tiếng Việt ngắn gọn, chính xác\n` +
      `   - partOfSpeech: loại từ (ví dụ: 名詞, 動詞, 形容詞, 副詞, 連体詞, 助詞, 助動詞...)\n` +
      `   - jlpt: N5..N1 nếu biết (không đoán bừa)\n` +
      `   - examples: 1-2 ví dụ (jp, vi) tự nhiên, có chứa surfaceForm\n` +
      `\n2) Tạo danh sách ngữ pháp (grammar) tối đa ${maxGrammar} mục.\n` +
      `   - pattern: mẫu ngữ pháp như xuất hiện trong bài\n` +
      `   - explanationVi: giải thích tiếng Việt\n` +
      `   - usage: ghi chú sắc thái, mức độ lịch sự (nếu cần)\n` +
      `   - examples: 1-2 ví dụ (jp, vi)\n` +
      `\n3) Trả về JSON đúng schema:\n` +
      `{"vocab":[{"surfaceForm":"...","reading":"...","lemma":"...","meaningVi":"...","partOfSpeech":"...","jlpt":"N3","examples":[{"jp":"...","vi":"..."}]}],` +
      `"grammar":[{"pattern":"...","explanationVi":"...","usage":"...","examples":[{"jp":"...","vi":"..."}]}]}`;

    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`;

    const aiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [{ text: userText }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      return NextResponse.json(
        { success: false, error: `AI provider error: ${aiResponse.status} ${errorText}` },
        { status: 502 }
      );
    }

    const data: any = await aiResponse.json();
    const content: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return NextResponse.json({ success: false, error: "Empty AI response" }, { status: 502 });
    }

    let parsed: AnalyzeResult | null = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // ignore
        }
      }
    }

    if (!parsed || !Array.isArray(parsed.vocab) || !Array.isArray(parsed.grammar)) {
      return NextResponse.json(
        { success: false, error: "AI response could not be parsed into expected schema" },
        { status: 502 }
      );
    }

    const normalized: AnalyzeResult = {
      vocab: parsed.vocab
        .map((v: any) => ({
          surfaceForm: String(v.surfaceForm || "").trim(),
          reading: v.reading ? String(v.reading).trim() : undefined,
          lemma: v.lemma ? String(v.lemma).trim() : undefined,
          meaningVi: String(v.meaningVi || "").trim(),
          partOfSpeech: v.partOfSpeech ? String(v.partOfSpeech).trim() : undefined,
          jlpt: v.jlpt ? String(v.jlpt).trim() : undefined,
          examples: Array.isArray(v.examples)
            ? v.examples
                .map((ex: any) => ({ jp: String(ex.jp || "").trim(), vi: String(ex.vi || "").trim() }))
                .filter((ex: any) => ex.jp && ex.vi)
            : [],
        }))
        .filter((v: VocabEntry) => v.surfaceForm && v.meaningVi),
      grammar: parsed.grammar
        .map((g: any) => ({
          pattern: String(g.pattern || "").trim(),
          explanationVi: String(g.explanationVi || "").trim(),
          usage: g.usage ? String(g.usage).trim() : undefined,
          examples: Array.isArray(g.examples)
            ? g.examples
                .map((ex: any) => ({ jp: String(ex.jp || "").trim(), vi: String(ex.vi || "").trim() }))
                .filter((ex: any) => ex.jp && ex.vi)
            : [],
        }))
        .filter((g: GrammarEntry) => g.pattern && g.explanationVi),
    };

    return NextResponse.json({ success: true, analysis: normalized });
  } catch (error) {
    console.error("/api/ai/analyze error:", error);
    return NextResponse.json({ success: false, error: "Unexpected server error" }, { status: 500 });
  }
}
