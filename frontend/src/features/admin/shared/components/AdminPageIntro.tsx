import type { ReactNode } from "react";

interface AdminPageIntroProps {
  title: string;
  description: string;
  icon: ReactNode;
}

export function AdminPageIntro({
  title,
  description,
  icon,
}: AdminPageIntroProps) {
  return (
    <div className="px-1 py-1 sm:px-0 lg:pl-5">
      <div className="flex items-stretch gap-3">
        <span className="flex shrink-0 self-stretch items-center justify-center text-brand">
          {icon}
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-txt-body">
            {title}
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm text-txt-muted">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
