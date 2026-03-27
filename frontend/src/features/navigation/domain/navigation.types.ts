export interface NavigationItem {
  title: string;
  url?: string;
  icon?: unknown;
  permissions?: string[];
  items?: NavigationItem[];
  badge?: string;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
  permissions?: string[];
}
