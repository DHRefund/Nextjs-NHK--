"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NewsStats from "./NewsStats";

interface NewsItem {
  title: string;
  content: string;
  link: string;
  pubDate: string;
  guid: string;
  categories: string[];
}

interface NewsResponse {
  success: boolean;
  news: NewsItem[];
  lastUpdated: string;
  error?: string;
}

export default function NHKNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/nhk-news");
      const data: NewsResponse = await response.json();

      if (data.success) {
        setNews(data.news);
        setLastUpdated(data.lastUpdated);
      } else {
        setError(data.error || "Failed to fetch news");
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching news:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();

    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 text-lg font-semibold mb-2">Lỗi khi tải tin tức</div>
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchNews}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const allCategories = news.flatMap((item) => item.categories);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">Tin tức NHK</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">Cập nhật tin mới nhất từ NHK Japan</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500">Cập nhật lần cuối</div>
            <div className="text-sm font-medium text-gray-700">{formatDate(lastUpdated)}</div>
          </div>
          <button
            onClick={fetchNews}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              <path d="M21 3v7h-7" />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      <NewsStats totalNews={news.length} lastUpdated={lastUpdated} categories={allCategories} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
        {news.map((item, index) => (
          <article
            key={item.guid || index}
            className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="p-5 sm:p-6 flex flex-col h-full">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                <Link
                  href={`/news/${encodeURIComponent(item.guid || item.title)}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {item.title}
                </Link>
              </h2>

              <p className="text-gray-700 text-sm sm:text-[0.95rem] leading-relaxed mb-4 line-clamp-3">
                {item.content}
              </p>

              <div className="mt-auto">
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.categories.slice(0, 3).map((category, catIndex) => (
                    <span
                      key={catIndex}
                      className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="whitespace-nowrap">{formatDate(item.pubDate)}</span>
                  <div className="flex gap-2">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Mở bài gốc"
                      title="Mở bài gốc"
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M14 3h7v7" />
                        <path d="M10 14L21 3" />
                        <path d="M21 10v11H3V3h11" />
                      </svg>
                      <span className="sr-only">Bài gốc</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {news.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-base sm:text-lg">Không có tin tức nào</div>
        </div>
      )}
    </div>
  );
}
