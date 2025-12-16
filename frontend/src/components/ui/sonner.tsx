"use client";

import { Toaster as Sonner } from "sonner";
import {
  CircleCheck,
  Info,
  Loader2,
  CircleX,
  TriangleAlert,
} from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useThemeStore();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheck className="mr-20 size-6 text-status-stable" />,
        info: <Info className="size-6 text-status-info" />,
        warning: <TriangleAlert className="size-6 text-status-alert" />,
        error: <CircleX className="size-6 text-status-critical" />,
        loading: <Loader2 className="size-6 animate-spin text-txt-muted" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:!bg-paper/30 group-[.toaster]:!backdrop-blur-xl group-[.toaster]:!text-txt-body group-[.toaster]:!border-line-hairline/40 group-[.toaster]:!shadow-xl !rounded-[24px] !border !font-body !p-5 !gap-4 !flex !items-center",

          description: "group-[.toast]:!text-txt-muted font-normal text-sm",

          actionButton:
            "group-[.toast]:!bg-brand group-[.toast]:!text-white !font-semibold group-[.toast]:hover:!bg-brand-hover transition-colors !rounded-full !px-4 !py-4 !text-xs !shadow-sm !text-center",

          cancelButton:
            "group-[.toast]:!bg-subtle group-[.toast]:!text-txt-body !transition-colors !rounded-full !px-4 !py-2 !text-xs !backdrop-blur-md !text-center",

          error: "group-[.toaster]:!text-status-critical font-semibold",
          success: "group-[.toaster]:!text-status-stable font-semibold",
          warning: "group-[.toaster]:!text-status-alert font-semibold",
          info: "group-[.toaster]:!text-status-info font-semibold",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
