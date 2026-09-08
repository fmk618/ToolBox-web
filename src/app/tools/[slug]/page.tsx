import type { Metadata } from "next";
import { TOOLS } from "../../../lib/tools/manifest";
import ToolPageClient from "./tool-page-client";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

// 每个工具页独立 title/description（静态导出时在构建期生成）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug);
  if (!tool) return {};
  // layout.tsx 的 title.template 会自动追加 “· FMKTools”
  return { title: tool.name, description: tool.description };
}

export default function ToolPage() {
  return <ToolPageClient />;
}
