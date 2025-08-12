# NHK News App

Ứng dụng đọc tin tức từ NHK Japan với giao diện tiếng Việt, được xây dựng bằng Next.js và TypeScript.

## Tính năng

- 📰 Parse RSS feed từ NHK Japan
- 🌐 Giao diện tiếng Việt thân thiện
- 📱 Responsive design cho mọi thiết bị
- 🔄 Tự động cập nhật tin tức mỗi 5 phút
- 📊 Thống kê tin tức và danh mục
- 🎨 Giao diện đẹp với Tailwind CSS
- 📖 Trang chi tiết bài viết với thông tin đầy đủ
- 🔗 Bài viết liên quan và navigation
- 🕷️ **Crawling dữ liệu trực tiếp từ URL bài viết NHK**
- 🖼️ **Trích xuất hình ảnh, tags, và metadata đầy đủ**

## Cài đặt

1. Clone repository:

```bash
git clone <repository-url>
cd nhk
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Chạy ứng dụng ở môi trường development:

```bash
npm run dev
```

4. Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000)

## Cấu trúc dự án

```
src/
├── app/
│   ├── api/
│   │   └── nhk-news/
│   │       ├── route.ts          # API endpoint để fetch RSS
│   │       ├── [id]/
│   │       │   └── route.ts      # API endpoint để fetch chi tiết bài viết
│   │       └── crawl/
│   │           └── route.ts      # API endpoint để crawl dữ liệu từ URL
│   ├── news/
│   │   └── [id]/
│   │       └── page.tsx          # Trang chi tiết bài viết
│   ├── test-crawl/
│   │   └── page.tsx              # Trang test crawling
│   ├── layout.tsx                # Layout chính
│   └── page.tsx                  # Trang chính
├── components/
│   ├── NHKNews.tsx              # Component chính hiển thị tin tức
│   ├── NewsStats.tsx            # Component hiển thị thống kê
│   ├── ArticleDetail.tsx        # Component hiển thị chi tiết bài viết
│   └── CrawlTest.tsx            # Component test crawling
└── globals.css                   # CSS toàn cục
```

## API Endpoints

### GET /api/nhk-news

Fetch và parse RSS feed từ NHK Japan.

### GET /api/nhk-news/[id]

Fetch thông tin chi tiết bài viết theo ID hoặc title. Hỗ trợ cả RSS feed và crawling trực tiếp từ URL.

### POST /api/nhk-news/crawl

Crawl dữ liệu trực tiếp từ URL bài viết NHK để lấy thông tin chi tiết.

**Response:**

```json
{
  "success": true,
  "news": [
    {
      "title": "Tiêu đề tin tức",
      "content": "Nội dung tóm tắt",
      "link": "URL bài viết",
      "pubDate": "Ngày xuất bản",
      "guid": "ID duy nhất",
      "categories": ["Danh mục 1", "Danh mục 2"]
    }
  ],
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

## Công nghệ sử dụng

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **rss-parser** - Parse RSS feeds
- **React 19** - UI library

## Tính năng nâng cao

- Tự động refresh tin tức mỗi 5 phút
- Xử lý lỗi và retry mechanism
- Responsive grid layout
- Hover effects và transitions
- Loading states và error handling

## Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## License

MIT License
