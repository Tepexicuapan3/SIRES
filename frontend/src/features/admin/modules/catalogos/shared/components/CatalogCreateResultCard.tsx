import { Badge } from "@/components/ui/badge";

interface CatalogCreateResultField {
  label: string;
  value: string | number | null | undefined;
}

interface CatalogCreateResultCardProps {
  title: string;
  description: string;
  badgeLabel?: string;
  fields: CatalogCreateResultField[];
}

export function CatalogCreateResultCard({
  title,
  description,
  badgeLabel = "Activo",
  fields,
}: CatalogCreateResultCardProps) {
  return (
    <div className="rounded-2xl border border-line-struct bg-subtle/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-txt-body">{title}</p>
          <p className="text-xs text-txt-muted">{description}</p>
        </div>
        <Badge variant="stable">{badgeLabel}</Badge>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.label}
            className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2"
          >
            <p className="text-xs text-txt-muted">{field.label}</p>
            <p className="text-sm font-medium text-txt-body">
              {field.value ?? "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
