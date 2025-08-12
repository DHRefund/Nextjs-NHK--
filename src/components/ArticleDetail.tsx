"use client";

import { useState, useEffect } from "react";
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

              {article.contentSentences && article.contentSentences.length > 0 ? (
                <div className="text-gray-700 leading-relaxed text-lg">
                  {article.contentSentences.map((sentence, idx) => (
                    <p key={idx} className="mb-2 whitespace-pre-line">
                      {sentence}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{article.content}</div>
              )}
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
    </div>
  );
}
