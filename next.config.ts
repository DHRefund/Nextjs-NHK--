import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      // Thêm domain của NHK vào đây
      "www3.nhk.or.jp",
      // Thêm các domain khác (nếu có)
      // "example.com",
    ],
  },
};

export default nextConfig;
