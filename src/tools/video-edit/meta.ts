import { Scissors } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "video-edit",
  name: "视频编辑与裁剪",
  category: "file",
  icon: Scissors,
  description: "预览视频并裁剪画面或剪辑时间范围，服务器使用 FFmpeg 输出 MP4",
  keywords: ["视频", "编辑", "裁剪", "剪辑", "trim", "crop", "ffmpeg"],
};
