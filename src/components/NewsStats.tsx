"use client";

interface NewsStatsProps {
  totalNews: number;
  lastUpdated: string;
  categories: string[];
}

export default function NewsStats({ totalNews, lastUpdated, categories }: NewsStatsProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const uniqueCategories = [...new Set(categories)].slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{totalNews}</div>
          <div className="text-sm text-gray-600">Tin tức</div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{uniqueCategories.length}</div>
          <div className="text-sm text-gray-600">Danh mục</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">{formatDate(lastUpdated)}</div>
          <div className="text-sm text-gray-600">Cập nhật lần cuối</div>
        </div>
      </div>

      {uniqueCategories.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Danh mục chính:</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map((category, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
