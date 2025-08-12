"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface ArticleDetailData {
  title: string;
  content: string;
  link: string;
  pubDate: string;
  guid: string;
  categories: string[];
  author: string;
  enclosure?: Record<string, unknown>;
  isoDate?: string;
  imageUrl?: string;
  summary?: string;
  tags?: string[];
  sourceUrl?: string;
  crawledAt?: string;
  contentParagraphs?: string[];
  contentSentences?: string[];
}

interface RelatedArticle {
  title: string;
  content: string;
  link: string;
  pubDate: string;
  guid: string;
  categories: string[];
}

interface ArticleResponse {
  success: boolean;
  article: ArticleDetailData;
  relatedArticles: RelatedArticle[];
  lastUpdated: string;
  error?: string;
  source?: string;
}

interface ArticleDetailProps {
  articleId: string;
}

export default function ArticleDetail({ articleId }: ArticleDetailProps) {
  const [article, setArticle] = useState<ArticleDetailData | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<
    | {
        vocab: {
          surfaceForm: string;
          reading?: string;
          lemma?: string;
          meaningVi: string;
          partOfSpeech?: string;
          jlpt?: string;
          examples?: Array<{ jp: string; vi: string }>;
        }[];
        grammar: {
          pattern: string;
          explanationVi: string;
          usage?: string;
          examples?: Array<{ jp: string; vi: string }>;
        }[];
      }
    | null
  >(null);
  const [selectedVocabIndex, setSelectedVocabIndex] = useState<number | null>(null);
  const router = useRouter();

  const fetchArticleDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/nhk-news/${encodeURIComponent(articleId)}`);
      const data: ArticleResponse = await response.json();

      if (data.success) {
        setArticle(data.article);

        setRelatedArticles(data.relatedArticles);
      } else {
        setError(data.error || "Failed to fetch article");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching article:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticleDetail();
  }, [articleId]);

  // Trigger AI analysis after article is loaded
  useEffect(() => {
    const runAnalysis = async () => {
      if (!article?.content) return;
      try {
        setAnalyzing(true);
        setAnalysisError(null);
        const response = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: article.content,
            sentences: article.contentSentences,
            maxVocab: 40,
            maxGrammar: 12,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          setAnalysis(null);
          setAnalysisError(data.error || "Không thể phân tích AI");
          return;
        }
        setAnalysis(data.analysis);
      } catch (e) {
        console.error("AI analyze error", e);
        setAnalysisError("Lỗi mạng khi gọi AI");
      } finally {
        setAnalyzing(false);
      }
    };

    runAnalysis();
  }, [article?.content, article?.contentSentences]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const goBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Lỗi khi tải bài viết</div>
          <div className="text-red-500 mb-4">{error}</div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={fetchArticleDetail}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={goBack}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Không tìm thấy bài viết</div>
          <button
            onClick={goBack}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </button>

        <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
          ← Về trang chủ
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <article className="bg-white rounded-lg shadow-md p-8">
            {/* Article Header */}
            <header className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {article.categories.map((category, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                    {category}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">{article.title}</h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {article.author}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(article.pubDate)}
                </div>
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {article.imageUrl && (
                <div className="mb-6">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-auto rounded-lg shadow-md" />
                </div>
              )}

              {article.summary && (
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <p className="text-blue-800 font-medium">{article.summary}</p>
                </div>
              )}

              <HighlightedContent
                text={article.content}
                sentences={article.contentSentences}
                vocab={analysis?.vocab || []}
                onClickVocab={(index) => setSelectedVocabIndex(index)}
              />
            </div>

            {/* Article Footer */}
            <footer className="mt-8 pt-6 border-t border-gray-200">
              {article.tags && article.tags.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <div>ID: {article.guid}</div>
                  {article.crawledAt && <div>Crawled: {formatDate(article.crawledAt)}</div>}
                </div>

                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Đọc bài gốc trên NHK
                </a>
              </div>
            </footer>
            {/* Grammar Section */}
            {analysis?.grammar && analysis.grammar.length > 0 && (
              <section className="mt-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Ngữ pháp xuất hiện trong bài</h3>
                <div className="space-y-4">
                  {analysis.grammar.map((g, i) => (
                    <div key={i} className="rounded-md border border-gray-200 p-4">
                      <div className="font-medium text-gray-900">{g.pattern}</div>
                      <div className="text-gray-700 text-sm mt-1">{g.explanationVi}</div>
                      {g.usage && <div className="text-gray-600 text-sm mt-1 italic">{g.usage}</div>}
                      {g.examples && g.examples.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-gray-700 space-y-1">
                          {g.examples.map((ex, j) => (
                            <li key={j}>
                              <span className="text-gray-900">{ex.jp}</span>
                              <span className="text-gray-500"> — {ex.vi}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Bài viết liên quan</h3>

            {relatedArticles.length > 0 ? (
              <div className="space-y-4">
                {relatedArticles.map((related, index) => (
                  <article key={related.guid || index} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                      <Link href={`/news/${encodeURIComponent(related.guid || related.title)}`}>{related.title}</Link>
                    </h4>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{related.content}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(related.pubDate)}</span>
                      <div className="flex gap-1">
                        {related.categories.slice(0, 2).map((category, catIndex) => (
                          <span key={catIndex} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">Không có bài viết liên quan</div>
            )}
          </div>
        </div>
      </div>

      {/* Vocab Modal */}
      {selectedVocabIndex !== null && analysis?.vocab?.[selectedVocabIndex] && (
        <VocabModal
          vocab={analysis.vocab[selectedVocabIndex]}
          onClose={() => setSelectedVocabIndex(null)}
        />
      )}
    </div>
  );
}

// ---------- HighlightedContent Component ----------
function HighlightedContent({
  text,
  sentences,
  vocab,
  onClickVocab,
}: {
  text: string;
  sentences?: string[];
  vocab: {
    surfaceForm: string;
    reading?: string;
    lemma?: string;
    meaningVi: string;
    partOfSpeech?: string;
    jlpt?: string;
    examples?: Array<{ jp: string; vi: string }>;
  }[];
  onClickVocab: (index: number) => void;
}) {
  const rangesBySentence = useMemo(() => {
    const items = vocab
      .map((v, i) => ({ ...v, index: i }))
      .filter((v) => v.surfaceForm && v.surfaceForm.trim().length > 0);

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const findRanges = (s: string) => {
      type Range = { start: number; end: number; index: number; text: string };
      const found: Range[] = [];
      items.forEach((it) => {
        const needle = it.surfaceForm.trim();
        if (!needle) return;
        const rx = new RegExp(escapeRegex(needle), "g");
        let match: RegExpExecArray | null;
        while ((match = rx.exec(s)) !== null) {
          found.push({ start: match.index, end: match.index + match[0].length, index: it.index, text: match[0] });
          // Avoid zero-length loops
          if (rx.lastIndex === match.index) rx.lastIndex++;
        }
      });

      // Resolve overlaps: sort by start asc, length desc; greedily keep non-overlapping
      found.sort((a, b) => (a.start - b.start) || (b.end - b.start) - (a.end - a.start));
      const merged: Range[] = [];
      let lastEnd = -1;
      for (const r of found) {
        if (r.start >= lastEnd) {
          merged.push(r);
          lastEnd = r.end;
        }
      }
      return merged;
    };

    const sentencesArray = Array.isArray(sentences) && sentences.length > 0 ? sentences : [text];
    return sentencesArray.map((s) => ({ s, ranges: findRanges(s) }));
  }, [text, sentences, vocab]);

  return (
    <div className="text-gray-700 leading-relaxed text-lg">
      {rangesBySentence.map(({ s, ranges }, idx) => {
        if (ranges.length === 0) {
          return (
            <p key={idx} className="mb-2 whitespace-pre-line">
              {s}
            </p>
          );
        }
        const nodes: React.ReactNode[] = [];
        let cursor = 0;
        ranges.forEach((r, i) => {
          if (cursor < r.start) {
            nodes.push(<span key={`t-${i}-pre`}>{s.slice(cursor, r.start)}</span>);
          }
          nodes.push(
            <button
              key={`h-${i}`}
              type="button"
              onClick={() => onClickVocab(r.index)}
              className="underline decoration-dotted underline-offset-4 hover:bg-yellow-50 rounded px-0.5 transition-colors"
              title="Xem giải thích"
            >
              {s.slice(r.start, r.end)}
            </button>
          );
          cursor = r.end;
        });
        if (cursor < s.length) {
          nodes.push(<span key={`t-post`}>{s.slice(cursor)}</span>);
        }
        return (
          <p key={idx} className="mb-2 whitespace-pre-line">
            {nodes}
          </p>
        );
      })}
    </div>
  );
}

// ---------- VocabModal Component ----------
function VocabModal({
  vocab,
  onClose,
}: {
  vocab: {
    surfaceForm: string;
    reading?: string;
    lemma?: string;
    meaningVi: string;
    partOfSpeech?: string;
    jlpt?: string;
    examples?: Array<{ jp: string; vi: string }>;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <h4 className="text-xl font-semibold text-gray-900">{vocab.surfaceForm}</h4>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          {vocab.reading && (
            <div>
              <span className="font-medium text-gray-700">Cách đọc:</span> {vocab.reading}
            </div>
          )}
          {vocab.lemma && (
            <div>
              <span className="font-medium text-gray-700">Dạng từ điển:</span> {vocab.lemma}
            </div>
          )}
          {vocab.partOfSpeech && (
            <div>
              <span className="font-medium text-gray-700">Loại từ:</span> {vocab.partOfSpeech}
            </div>
          )}
          {vocab.jlpt && (
            <div>
              <span className="font-medium text-gray-700">JLPT:</span> {vocab.jlpt}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="text-gray-800"><span className="font-medium">Nghĩa:</span> {vocab.meaningVi}</div>
        </div>
        {vocab.examples && vocab.examples.length > 0 && (
          <div className="mt-4">
            <div className="font-medium text-gray-900 mb-2">Ví dụ</div>
            <ul className="space-y-2 text-sm text-gray-700">
              {vocab.examples.map((ex, i) => (
                <li key={i} className="bg-gray-50 rounded-md p-2">
                  <div className="text-gray-900">{ex.jp}</div>
                  <div className="text-gray-600">{ex.vi}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
