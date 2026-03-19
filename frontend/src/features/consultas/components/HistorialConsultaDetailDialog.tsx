import { Activity, Calendar, FileText, Pill, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConsultaSignos {
  presion: string;
  temp: string;
  fc: string;
  peso: string;
}

export interface HistorialConsultaItem {
  id: number;
  fecha: string;
  medico: string;
  tipo: string;
  diagnostico: string;
  tratamiento: string;
  signos: ConsultaSignos;
  recetas: number;
  estudios: number;
}

interface HistorialConsultaDetailDialogProps {
  consulta: HistorialConsultaItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HistorialConsultaDetailDialog = ({
  consulta,
  open,
  onOpenChange,
}: HistorialConsultaDetailDialogProps) => {
  if (!consulta) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-4 text-brand" />
            {new Date(consulta.fecha).toLocaleDateString("es-MX")}
          </DialogTitle>
          <DialogDescription>{consulta.tipo}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="rounded-lg border border-line-struct bg-subtle p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-txt-body">
              <UserRound className="size-4 text-brand" />
              Profesional responsable
            </p>
            <p className="text-sm text-txt-muted">{consulta.medico}</p>
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <article className="rounded-lg border border-line-struct p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-txt-body">
                <FileText className="size-4 text-brand" />
                Diagnostico
              </p>
              <p className="text-sm text-txt-muted">{consulta.diagnostico}</p>
            </article>

            <article className="rounded-lg border border-line-struct p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-txt-body">
                <Pill className="size-4 text-brand" />
                Tratamiento
              </p>
              <p className="text-sm text-txt-muted">{consulta.tratamiento}</p>
            </article>
          </section>

          <section className="rounded-lg border border-line-struct p-3">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-txt-body">
              <Activity className="size-4 text-brand" />
              Signos vitales
            </p>
            <div className="grid gap-2 text-sm text-txt-muted md:grid-cols-2">
              <p>PA: {consulta.signos.presion}</p>
              <p>Temperatura: {consulta.signos.temp}</p>
              <p>FC: {consulta.signos.fc}</p>
              <p>Peso: {consulta.signos.peso}</p>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            {consulta.recetas > 0 ? (
              <Badge variant="secondary">{consulta.recetas} receta(s)</Badge>
            ) : null}
            {consulta.estudios > 0 ? (
              <Badge variant="secondary">{consulta.estudios} estudio(s)</Badge>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
