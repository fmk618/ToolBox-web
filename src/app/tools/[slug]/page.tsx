"use client";

import { notFound, useParams } from "next/navigation";
import { getTool } from "../../../lib/tools/manifest";

export default function ToolPage() {
  const params = useParams<{ slug: string }>();
  const tool = params?.slug ? getTool(params.slug) : undefined;

  if (!tool) {
    notFound();
  }

  const Cmp = tool.component;
  return <Cmp />;
}
