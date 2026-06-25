import { TOOLS } from "../../../lib/tools/manifest";
import ToolPageClient from "./tool-page-client";

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export default function ToolPage() {
  return <ToolPageClient />;
}
