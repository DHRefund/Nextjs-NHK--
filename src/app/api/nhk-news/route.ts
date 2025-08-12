import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET() {
  try {
    const feed = await parser.parseURL("https://www3.nhk.or.jp/rss/news/cat0.xml");

    const news = feed.items.map((item) => ({
      title: item.title,
      content: item.contentSnippet,
      link: item.link,
      pubDate: item.pubDate,
      guid: item.guid,
      categories: item.categories || [],
    }));

    return NextResponse.json({
      success: true,
      news,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching NHK news:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch news",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
