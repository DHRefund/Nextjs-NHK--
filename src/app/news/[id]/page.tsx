import ArticleDetail from "@/components/ArticleDetail";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>; // params là một Promise
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params; // Destructure và await params
  return {
    title: `Chi tiết tin tức ${id} - NHK News`,
    description: `Xem chi tiết tin tức ${id} từ NHK Japan`,
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <ArticleDetail articleId={id} />;
}
