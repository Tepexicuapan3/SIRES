import { Stethoscope } from "lucide-react";

interface DisponibilidadMedicoCardMedico {
  id: number;
  nombreCompleto: string;
  servicio: string | null;
  especialidades: { name: string }[];
  centros: { centroId: number; centroNombre: string }[];
  consultoriosActivos: { centroId: number; centroNombre: string; consultorioNumero: number; consultorioNombre: string }[];
}

export function DisponibilidadMedicoCard({
  medico,
  centroFiltroId,
  selected,
  onSelect,
}: {
  medico:         DisponibilidadMedicoCardMedico;
  centroFiltroId: number | null;
  selected:       boolean;
  onSelect:       () => void;
}) {
  const especialidad = medico.especialidades[0]?.name ?? medico.servicio;

  // Si hay centro filtrado, mostrar solo lo relativo a ese centro; si no, todos.
  const centros = centroFiltroId
    ? medico.centros.filter((c) => c.centroId === centroFiltroId)
    : medico.centros;
  const consultorios = centroFiltroId
    ? medico.consultoriosActivos.filter((c) => c.centroId === centroFiltroId)
    : medico.consultoriosActivos;

  const centroLabel = centros.map((c) => c.centroNombre).join(", ");
  const consultorioLabel = consultorios.map((c) => `#${c.consultorioNumero}`).join(", ");

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-line-struct hover:bg-subtle/40",
      ].join(" ")}
    >
      <div
        className={[
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-primary text-white" : "bg-subtle text-txt-muted",
        ].join(" ")}
      >
        <Stethoscope className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={[
          "truncate text-sm font-semibold",
          selected ? "text-primary" : "text-txt-body",
        ].join(" ")}>
          {medico.nombreCompleto}
        </p>
        {especialidad ? (
          <p className="truncate text-xs text-txt-muted">{especialidad}</p>
        ) : null}
        {centroLabel ? (
          <p className="truncate text-[11px] text-txt-muted/80 mt-0.5">{centroLabel}</p>
        ) : null}
        {consultorioLabel ? (
          <p className="truncate text-[11px] font-medium text-primary/70">
            Consultorio {consultorioLabel}
          </p>
        ) : null}
      </div>
    </button>
  );
}
