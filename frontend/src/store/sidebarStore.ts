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

  // Indicadores de notificacion para grupos con badges en hijos
  badgeSeenGroups: Record<string, boolean>;
  markGroupBadgeSeen: (groupTitle: string) => void;

  resetSidebarState: () => void;

  // Estado de hidratacion de persistencia
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;

  // Estado Mobile (no se persiste)
  isOpenMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

const INITIAL_STATE = {
  isOpen: true,
  openGroups: {},
  badgeSeenGroups: {},
  isOpenMobile: false,
};

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Sidebar Principal
      isOpen: INITIAL_STATE.isOpen,
      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
      setOpen: (open: boolean) => set({ isOpen: open }),

      // Grupos (Menús desplegables)
      openGroups: INITIAL_STATE.openGroups,
      toggleGroup: (groupTitle, isOpen) =>
        set((state) => ({
          openGroups: { ...state.openGroups, [groupTitle]: isOpen },
          badgeSeenGroups: isOpen
            ? { ...state.badgeSeenGroups, [groupTitle]: true }
            : state.badgeSeenGroups,
        })),

      // Indicadores de notificacion
      badgeSeenGroups: INITIAL_STATE.badgeSeenGroups,
      markGroupBadgeSeen: (groupTitle) =>
        set((state) => ({
          badgeSeenGroups: { ...state.badgeSeenGroups, [groupTitle]: true },
        })),

      // Mobile (sin persistencia en storage, siempre arranca cerrado)
      isOpenMobile: INITIAL_STATE.isOpenMobile,
      setOpenMobile: (open: boolean) => set({ isOpenMobile: open }),

      resetSidebarState: () => set({ ...INITIAL_STATE }),
      // Nota: cuando existan mas stores de UI, agregar sus resets en logout.

      hasHydrated: false,
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),
    }),
    {
      name: "sidebar-storage", // Key en localStorage
      partialize: (state) => ({
        isOpen: state.isOpen,
        openGroups: state.openGroups,
        badgeSeenGroups: state.badgeSeenGroups,
      }), // Solo persistir lo necesario
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
