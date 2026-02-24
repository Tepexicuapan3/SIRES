interface VisitTimelineEntry {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

interface VisitTimelinePanelProps {
  entries: VisitTimelineEntry[];
}

const formatDateTime = (value: string): string => {
  return new Date(value).toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const VisitTimelinePanel = ({ entries }: VisitTimelinePanelProps) => {
  return (
    <section className="space-y-3 rounded-xl border border-line-struct bg-paper p-4">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-txt-body">Linea de tiempo</h2>
        <p className="text-sm text-txt-muted">
          Seguimiento clinico de acciones y cambios de estado de la visita.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-txt-muted" role="status">
          Aun no hay eventos registrados para esta visita.
        </p>
      ) : (
        <ol className="space-y-3" aria-label="Linea de tiempo de la visita">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-line-hairline bg-subtle p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-txt-body">
                  {entry.title}
                </p>
                <time
                  className="text-xs text-txt-muted"
                  dateTime={entry.createdAt}
                >
                  {formatDateTime(entry.createdAt)}
                </time>
              </div>
              {entry.description ? (
                <p className="mt-1 text-sm text-txt-muted">
                  {entry.description}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export type { VisitTimelineEntry };
