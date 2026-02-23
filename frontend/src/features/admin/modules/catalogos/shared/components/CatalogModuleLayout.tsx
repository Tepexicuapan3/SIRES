import type { ReactNode } from "react";
import { AdminPageIntro } from "@features/admin/shared/components/AdminPageIntro";

interface CatalogModuleLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

export function CatalogModuleLayout({
  title,
  description,
  icon,
  children,
}: CatalogModuleLayoutProps) {
  return (
    <div className="mx-auto w-full space-y-6 px-4 pb-2 sm:px-6 lg:max-w-340 lg:px-8 xl:px-10">
      <AdminPageIntro title={title} description={description} icon={icon} />
      {children}
    </div>
  );
}
