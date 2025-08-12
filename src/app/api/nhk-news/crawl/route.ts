import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is required",
        },
        { status: 400 }
      );
    }

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract article data
    const articleData = {
      title: "",
      content: "",
      publishDate: "",
      author: "",
      category: "",
      imageUrl: "",
      summary: "",
      tags: [] as string[],
      rawHtml: html.substring(0, 1000), // First 1000 chars for debugging
      contentParagraphs: [] as string[],
      contentSentences: [] as string[],
    };

    // Extract title
    const titleElement = $(".content--detail-title > .content--title").first();
    if (titleElement.length) {
      articleData.title = titleElement.text().trim();
    }

    // Extract content from .content--detail-more
    let content = "";

    // Tìm tất cả các section.content--body trong .content--detail-more
    $(".content--detail-more .content--body").each((_, element) => {
      const $element = $(element);

      // Lấy tiêu đề phụ (nếu có)
      const title = $element.find(".body-title").text().trim();
      if (title) {
        // Làm nổi bật tiêu đề phụ mà không dùng Markdown
        content += `\n【${title}】\n\n`;
      }

      // Lấy phần tử .body-text
      const $bodyText = $element.find(".body-text");

      if ($bodyText.length) {
        // Duyệt qua tất cả các node con (text và element)
        $bodyText.contents().each((_, node) => {
          if (node.type === "text") {
            // Thêm văn bản (sau khi trim)
            const text = $(node).text().trim();
            if (text) {
              content += text;
            }
          } else if (node.type === "tag") {
            const tagName = node.name.toLowerCase();

            if (tagName === "br") {
              // Khi gặp <br> → xuống dòng
              content += "\n";
            } else if (tagName === "p") {
              // Khi gặp <p> → thêm đoạn văn + xuống dòng kép
              const pText = $(node).text().trim();
              if (pText) {
                content += pText + "\n\n";
              }
            }
          }
        });

        // Đảm bảo kết thúc bằng 2 dòng trống trước phần tiếp theo
        if (content && !content.endsWith("\n\n")) {
          content += "\n\n";
        }
      }
    });

    // Làm sạch nội dung thừa
    content = content.replace(/\n{3,}/g, "\n\n"); // Giới hạn tối đa 2 dòng trống
    content = content.trim();

    // Gán vào articleData
    articleData.content = content;

    // Tách đoạn theo dòng trống và chuẩn hóa xuống dòng đơn trong đoạn
    const paragraphs = content
      .split(/\n{2,}/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);

    // Tách câu: ưu tiên dấu câu tiếng Nhật (。！？), fallback Latin (.!?)
    const sentences: string[] = [];
    for (const p of paragraphs) {
      const jpChunks = p.match(/[^。！？]+[。！？]?/g);
      if (jpChunks && jpChunks.length > 0) {
        jpChunks.forEach((s) => {
          const t = s.trim();
          if (t) sentences.push(t);
        });
      } else {
        const enChunks = p.match(/[^.!?]+[.!?]?/g) || [p];
        enChunks.forEach((s) => {
          const t = s.trim();
          if (t) sentences.push(t);
        });
      }
    }

    articleData.contentParagraphs = paragraphs;
    articleData.contentSentences = sentences;
    console.log("articleData.content", articleData.content);

    // Extract publish date
    const dateSelectors = [
      ".publish-date",
      ".date",
      ".time",
      '[class*="date"]',
      '[class*="time"]',
      "time",
      ".article-date",
    ];

    for (const selector of dateSelectors) {
      const dateElement = $(selector);
      if (dateElement.length > 0) {
        const dateText = dateElement.text().trim();
        if (dateText) {
          articleData.publishDate = dateText;
          break;
        }
      }
    }

    // Extract author
    const authorSelectors = [".author", ".byline", '[class*="author"]', '[class*="byline"]'];

    for (const selector of authorSelectors) {
      const authorElement = $(selector);
      if (authorElement.length > 0) {
        const authorText = authorElement.text().trim();
        if (authorText && !authorText.includes("NHK")) {
          articleData.author = authorText;
          break;
        }
      }
    }

    // Extract category
    const scriptContent = $('script:contains("__DetailProp__")').html();

    if (scriptContent) {
      // Bước 2: Dùng regex để trích xuất giá trị `cate`
      const cateMatch = scriptContent.match(/cate:\s*['"]?(\d+)['"]?/);

      if (cateMatch) {
        const cateCode = cateMatch[1]; // → '5'

        // Bước 3: Map mã số sang tên danh mục
        const categoryMap = {
          "1": "社会",
          "2": "生活",
          "3": "文化・芸術",
          "4": "政治",
          "5": "ビジネス",
          "6": "国際",
          "7": "スポーツ",
          "8": "気象・災害",
          business: "ビジネス", // fallback
        };

        articleData.category = categoryMap[cateCode as keyof typeof categoryMap] || `cate-${cateCode}`;
      }
    }

    // Extract image
    if (scriptContent) {
      const imageMatch = scriptContent.match(/img\s*:\s*['"]([^'"]+)['"]/);
      if (imageMatch) {
        const imgCode = imageMatch[1];

        articleData.imageUrl = `https://www3.nhk.or.jp/news/${imgCode}`;
      }
    }

    // Extract summary/description
    const summaryElement = $(".content--summary").text().trim();
    articleData.summary = summaryElement;

    // Extract tags
    const tagSelectors = [".tags a", ".tag a", '[class*="tag"] a', ".keywords a"];

    for (const selector of tagSelectors) {
      const tagElements = $(selector);
      if (tagElements.length > 0) {
        articleData.tags = tagElements.map((_, el) => $(el).text().trim()).get();
        break;
      }
    }

    // Clean up content
    if (articleData.content) {
      // Remove extra whitespace and normalize
      articleData.content = articleData.content
        .replace(/\n\s*\n/g, "\n\n")
        .replace(/\s+/g, " ")
        .trim();
    }

    // If no title found, try to extract from meta tags
    if (!articleData.title) {
      const metaTitle =
        $('meta[property="og:title"]').attr("content") || $('meta[name="title"]').attr("content") || $("title").text();
      if (metaTitle) {
        articleData.title = metaTitle.trim();
      }
    }

    // If no summary found, try meta description
    if (!articleData.summary) {
      const metaDesc =
        $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content");
      if (metaDesc) {
        articleData.summary = metaDesc.trim();
      }
    }

    return NextResponse.json({
      success: true,
      article: articleData,
      sourceUrl: url,
      crawledAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error crawling article:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to crawl article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
