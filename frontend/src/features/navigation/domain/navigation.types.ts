import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
  title: string;
  url?: string;
  icon?: LucideIcon;
  permissions?: string[];
  items?: NavigationItem[];
  badge?: string;
}

export interface NavigationSection {
  title: string;
  icon?: LucideIcon;
  items: NavigationItem[];
  permissions?: string[];
}
