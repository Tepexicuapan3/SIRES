import * as React from "react";

import { useSidebarStore } from "@/store/sidebarStore";

export type SidebarContextValue = {
  state: "expanded" | "collapsed";
  isMobile: boolean;
};

export const SidebarContext = React.createContext<SidebarContextValue | null>(
  null,
);

export function useSidebarContext() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider.");
  }
  return context;
}

export function useSidebar() {
  const store = useSidebarStore();
  const context = useSidebarContext();
  return { ...store, ...context };
}
