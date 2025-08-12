import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Decode the ID to get the actual URL
    const decodedId = decodeURIComponent(id);

    // Check if this is a URL (starts with http)
    if (decodedId.startsWith("http")) {
      // This is a direct URL, crawl it

      try {
        const crawlResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/nhk-news/crawl`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url: decodedId }),
          }
        );

        if (crawlResponse.ok) {
          const crawlData = await crawlResponse.json();

          if (crawlData.success) {
            // Get related articles from RSS feed
            const feed = await parser.parseURL("https://www3.nhk.or.jp/rss/news/cat0.xml");
            const relatedArticles = feed.items.slice(0, 6).map((item) => ({
              title: item.title,
              content: item.contentSnippet,
              link: item.link,
              pubDate: item.pubDate,
              guid: item.guid,
              categories: item.categories || [],
            }));

            return NextResponse.json({
              success: true,
              article: {
                title: crawlData.article.title,
                content: crawlData.article.content || crawlData.article.summary,
                contentParagraphs: crawlData.article.contentParagraphs,
                contentSentences: crawlData.article.contentSentences,
                link: decodedId,
                pubDate: crawlData.article.publishDate,
                guid: decodedId,
                categories: crawlData.article.category ? [crawlData.article.category] : [],
                author: crawlData.article.author || "NHK",
                imageUrl: crawlData.article.imageUrl,
                summary: crawlData.article.summary,
                tags: crawlData.article.tags,
                sourceUrl: decodedId,
                crawledAt: crawlData.crawledAt,
              },
              relatedArticles,
              lastUpdated: new Date().toISOString(),
              source: "crawled",
            });
          }
        }
      } catch (crawlError) {
        console.error("Crawl error:", crawlError);
        // Fall back to RSS feed if crawling fails
      }
    }

    // Fallback to RSS feed method

    const feed = await parser.parseURL("https://www3.nhk.or.jp/rss/news/cat0.xml");

    // Find the specific article by guid or title
    const article = feed.items.find((item) => item.guid === id || item.title === decodeURIComponent(id));

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: "Article not found",
        },
        { status: 404 }
      );
    }

    // Get related articles (same category or recent articles)
    const relatedArticles = feed.items
      .filter((item) => item.guid !== article.guid && item.title !== article.title)
      .slice(0, 6)
      .map((item) => ({
        title: item.title,
        content: item.contentSnippet,
        link: item.link,
        pubDate: item.pubDate,
        guid: item.guid,
        categories: item.categories || [],
      }));

    const articleDetail = {
      title: article.title,
      content: article.contentSnippet,
      link: article.link,
      pubDate: article.pubDate,
      guid: article.guid,
      categories: article.categories || [],
      author: article.creator || "NHK",
      // Add more fields if available
      enclosure: article.enclosure,
      isoDate: article.isoDate,
    };

    return NextResponse.json({
      success: true,
      article: articleDetail,
      relatedArticles,
      lastUpdated: new Date().toISOString(),
      source: "rss",
    });
  } catch (error) {
    console.error("Error fetching article detail:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch article detail",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
