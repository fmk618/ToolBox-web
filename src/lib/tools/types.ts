import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

export type CategoryId =
  | "convert"
  | "codec"
  | "crypto"
  | "text"
  | "dev"
  | "time"
  | "data"
  | "web"
  | "image"
  | "system";

export interface ToolMeta {
  slug: string;
  name: string;
  category: CategoryId;
  icon: LucideIcon;
  description: string;
  keywords?: string[];
}

export interface Tool extends ToolMeta {
  component: ComponentType;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: LucideIcon;
}
