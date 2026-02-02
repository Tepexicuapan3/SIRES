import type { ComponentProps, ComponentPropsWithRef, ReactNode } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

type BreadcrumbProps = ComponentPropsWithRef<"nav"> & {
  separator?: ReactNode;
};

function Breadcrumb({ ...props }: BreadcrumbProps) {
  return <nav aria-label="breadcrumb" {...props} />;
}
Breadcrumb.displayName = "Breadcrumb";

type BreadcrumbListProps = ComponentPropsWithRef<"ol">;

function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1.5 wrap-break-words text-sm text-txt-muted sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}
BreadcrumbList.displayName = "BreadcrumbList";

type BreadcrumbItemProps = ComponentPropsWithRef<"li">;

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return (
    <li
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}
BreadcrumbItem.displayName = "BreadcrumbItem";

type BreadcrumbLinkProps = ComponentPropsWithRef<"a"> & {
  asChild?: boolean;
};

function BreadcrumbLink({ asChild, className, ...props }: BreadcrumbLinkProps) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 transition-colors hover:text-txt-body",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-struct focus-visible:border focus-visible:border-line-struct",
        className,
      )}
      {...props}
    />
  );
}
BreadcrumbLink.displayName = "BreadcrumbLink";

type BreadcrumbPageProps = ComponentPropsWithRef<"span">;

function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps) {
  return (
    <span
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-txt-body", className)}
      {...props}
    />
  );
}
BreadcrumbPage.displayName = "BreadcrumbPage";

type BreadcrumbSeparatorProps = ComponentProps<"li">;

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

type BreadcrumbEllipsisProps = ComponentProps<"span">;

function BreadcrumbEllipsis({ className, ...props }: BreadcrumbEllipsisProps) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn("flex h-9 w-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More</span>
    </span>
  );
}
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
