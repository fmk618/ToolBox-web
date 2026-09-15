import { Video } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "video-extract",
  name: "视频解析",
  category: "file",
  icon: Video,
  description: "解析视频链接的标题、作者、缩略图和字幕，支持受限任务下载",
  keywords: ["视频", "解析", "字幕", "转写", "YouTube", "yt-dlp", "video"],
};
