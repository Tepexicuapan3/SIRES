import type { ReactNode } from "react";

export interface AdminDetailsDialogSection {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
  hidden?: boolean;
}

export interface AdminDetailsDialogFooterControls {
  onCancel: () => void;
}
