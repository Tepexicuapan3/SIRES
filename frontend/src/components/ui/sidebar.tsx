/**
 * ============================================
 * SIDEBAR PRIMITIVES - Adaptado a Metro CDMX
 * ============================================
 *
 * Componente base del sidebar con soporte para:
 * - Colapso/expansión
 * - Estados activos/hover
 * - Navegación RBAC
 * - Dark mode
 *
 * Inspirado en shadcn/ui pero simplificado y usando tokens Metro.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Context para manejar el estado del sidebar
 */
interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  isMobile: boolean;
  state: "expanded" | "collapsed";
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined,
);

export const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar debe usarse dentro de un SidebarProvider");
  }
  return context;
};

/**
 * Provider del Sidebar - Maneja el estado de colapso
 */
interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export const SidebarProvider = ({
  children,
  defaultOpen = true,
}: SidebarProviderProps) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const value = React.useMemo(
    () => ({
      isOpen,
      toggle: () => setIsOpen((prev) => !prev),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isMobile,
      state: isOpen ? ("expanded" as const) : ("collapsed" as const),
    }),
    [isOpen, isMobile],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};

/**
 * Contenedor principal del Sidebar
 */
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right";
  variant?: "default" | "inset";
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    { className, side = "left", variant = "default", children, ...props },
    ref,
  ) => {
    const { isOpen, state } = useSidebar();

    return (
      <aside
        ref={ref}
        data-state={state}
        data-variant={variant}
        data-side={side}
        className={cn(
          // Base - se comporta como peer para que SidebarInset reaccione
          "peer flex h-screen flex-col border-r border-line-struct bg-paper transition-all duration-300",
          // Width
          isOpen ? "w-64" : "w-16",
          // Side
          side === "right" && "order-last border-l border-r-0",
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    );
  },
);
Sidebar.displayName = "Sidebar";

/**
 * Header del Sidebar (logo + trigger)
 */
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between border-b border-line-hairline px-4 py-4",
        className,
      )}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

/**
 * Content scrollable del Sidebar
 */
export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";

/**
 * Footer del Sidebar (usuario)
 */
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("border-t border-line-hairline p-4 mt-auto", className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

/**
 * Grupo de navegación
 */
export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("space-y-1 px-3 py-2", className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = "SidebarGroup";

/**
 * Label del grupo
 */
export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isOpen } = useSidebar();

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-txt-muted",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

/**
 * Contenedor de items
 */
export const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("space-y-1", className)} {...props} />;
});
SidebarGroupContent.displayName = "SidebarGroupContent";

/**
 * Menu (lista de items)
 */
export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  return <ul ref={ref} className={cn("space-y-1", className)} {...props} />;
});
SidebarMenu.displayName = "SidebarMenu";

/**
 * Menu Item
 */
export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => {
  return <li ref={ref} className={cn("list-none", className)} {...props} />;
});
SidebarMenuItem.displayName = "SidebarMenuItem";

/**
 * Menu Button (el link/botón clickeable)
 */
interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string;
  size?: "default" | "sm" | "lg";
}

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(
  (
    { className, asChild, isActive, tooltip, size = "default", ...props },
    ref,
  ) => {
    const { isOpen } = useSidebar();
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        title={!isOpen ? tooltip : undefined}
        className={cn(
          // Base
          "flex w-full items-center gap-3 rounded-lg text-sm font-medium transition-colors",
          // Sizes
          size === "default" && "px-3 py-2",
          size === "sm" && "px-2 py-1.5 text-xs",
          size === "lg" && "px-4 py-3 text-base",
          // Hover
          "hover:bg-subtle hover:text-txt-body",
          // Active state
          isActive
            ? "bg-brand/10 text-brand hover:bg-brand/20"
            : "text-txt-muted",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
          // Collapsed (solo icono centrado)
          !isOpen && "justify-center px-2",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

/**
 * Trigger para colapsar/expandir
 */
export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { isOpen, toggle } = useSidebar();

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={cn("h-8 w-8 shrink-0", className)}
      aria-label={isOpen ? "Colapsar sidebar" : "Expandir sidebar"}
      {...props}
    >
      <ChevronLeft
        className={cn("h-4 w-4 transition-transform", !isOpen && "rotate-180")}
      />
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

/**
 * Menu Action (Chevron para collapsibles)
 */
export const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  }
>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={cn(
        "absolute right-1 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-md p-0 text-txt-muted outline-none transition-transform hover:bg-subtle hover:text-txt-body focus-visible:ring-2 focus-visible:ring-brand [&>svg]:size-4",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

/**
 * Submenu (lista de subitems)
 */
export const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn(
        "mx-3.5 flex min-w-0 flex-col gap-1 border-l border-line-hairline px-2.5 py-0.5",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSub.displayName = "SidebarMenuSub";

/**
 * Submenu Item
 */
export const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ ...props }, ref) => {
  return <li ref={ref} {...props} />;
});
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

/**
 * Submenu Button
 */
export const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    asChild?: boolean;
    isActive?: boolean;
  }
>(({ className, asChild, isActive, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      ref={ref}
      className={cn(
        "flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-txt-muted outline-none hover:bg-subtle hover:text-txt-body focus-visible:ring-2 focus-visible:ring-brand active:bg-subtle active:text-txt-body disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4",
        isActive && "bg-brand/10 text-brand font-medium",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

/**
 * SidebarInset - Área de contenido principal con padding/márgenes automáticos
 */
export const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"main">
>(({ className, ...props }, ref) => {
  return (
    <main
      ref={ref}
      className={cn(
        "relative flex min-h-svh flex-1 flex-col bg-app",
        "peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4)*4)]",
        "md:peer-data-[variant=inset]:m-2",
        "md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2",
        "md:peer-data-[variant=inset]:ml-0",
        "md:peer-data-[variant=inset]:rounded-xl",
        "md:peer-data-[variant=inset]:shadow",
        className,
      )}
      {...props}
    />
  );
});
SidebarInset.displayName = "SidebarInset";
