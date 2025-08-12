"use client";

import { useState } from "react";

export default function CrawlTest() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testCrawl = async () => {
    if (!url) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch("/api/nhk-news/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || "Failed to crawl");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error testing crawl:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Crawling NHK Article</h2>

        <div className="mb-4">
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
            NHK Article URL:
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www3.nhk.or.jp/news/html/20250812/k10014892171000.html"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={testCrawl}
          disabled={!url || loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Crawling..." : "Test Crawl"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-600 font-medium">Error:</div>
            <div className="text-red-500">{error}</div>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Crawl Result:</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Article Data:</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Title:</strong> {result.article.title}
                </div>
                <div>
                  <strong>Content Length:</strong> {result.article.content?.length || 0} characters
                </div>
                <div>
                  <strong>Publish Date:</strong> {result.article.publishDate}
                </div>
                <div>
                  <strong>Author:</strong> {result.article.author}
                </div>
                <div>
                  <strong>Category:</strong> {result.article.category}
                </div>
                <div>
                  <strong>Image URL:</strong> {result.article.imageUrl || "None"}
                </div>
                <div>
                  <strong>Summary:</strong> {result.article.summary || "None"}
                </div>
                <div>
                  <strong>Tags:</strong> {result.article.tags?.join(", ") || "None"}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Raw HTML Preview:</h4>
              <pre className="text-xs text-gray-600 overflow-auto max-h-40">{result.article.rawHtml}</pre>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Metadata:</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Source URL:</strong> {result.sourceUrl}
                </div>
                <div>
                  <strong>Crawled At:</strong> {result.crawledAt}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
