import { AudioLines } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "audio-convert",
  name: "音频转换",
  category: "file",
  icon: AudioLines,
  description: "将音频或视频转换为 MP3、WAV、M4A、AAC 或 FLAC",
  keywords: ["音频", "转换", "转码", "mp3", "wav", "audio", "ffmpeg"],
};
