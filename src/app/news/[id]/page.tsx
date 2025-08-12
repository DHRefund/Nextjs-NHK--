import ArticleDetail from "@/components/ArticleDetail";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: `Chi tiết tin tức - NHK News`,
    description: "Xem chi tiết tin tức từ NHK Japan",
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ArticleDetail articleId={id} />;
}
