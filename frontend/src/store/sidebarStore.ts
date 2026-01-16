import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  // Estado principal del sidebar (Desktop)
  isOpen: boolean;
  toggleSidebar: () => void;
  setOpen: (open: boolean) => void;

  // Estado de grupos/menús (Accordions)
  openGroups: Record<string, boolean>;
  toggleGroup: (groupTitle: string, isOpen: boolean) => void;
  
  // Estado Mobile (no se persiste)
  isOpenMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Sidebar Principal
      isOpen: true,
      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open: boolean) => set({ isOpen: open }),

      // Grupos (Menús desplegables)
      openGroups: {},
      toggleGroup: (groupTitle, isOpen) =>
        set((state) => ({
          openGroups: { ...state.openGroups, [groupTitle]: isOpen },
        })),

      // Mobile (sin persistencia en storage, siempre arranca cerrado)
      isOpenMobile: false,
      setOpenMobile: (open: boolean) => set({ isOpenMobile: open }),
    }),
    {
      name: "sidebar-storage", // Key en localStorage
      partialize: (state) => ({ 
        isOpen: state.isOpen,
        openGroups: state.openGroups 
      }), // Solo persistir lo necesario
    }
  )
);
