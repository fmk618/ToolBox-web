"use client";

import { useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import { getTool } from "../../../lib/tools/manifest";
import { pushRecent } from "../../../lib/recents";

export default function ToolPage() {
  const params = useParams<{ slug: string }>();
  const tool = params?.slug ? getTool(params.slug) : undefined;

  useEffect(() => {
    if (params?.slug) pushRecent(params.slug);
  }, [params?.slug]);

  if (!tool) {
    notFound();
  }

  const Cmp = tool.component;
  return <Cmp />;
}
