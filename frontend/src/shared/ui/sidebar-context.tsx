import { createContext, useContext } from "react";

import { useSidebarStore } from "@app/state/ui/sidebarStore";

export type SidebarContextValue = {
  state: "expanded" | "collapsed";
  isMobile: boolean;
};

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
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
