import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckSquare, Loader2, Mail, Paperclip, Send, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import { Input }  from "@shared/ui/input";
import { Label }  from "@shared/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@shared/ui/dialog";
import { Badge } from "@shared/ui/badge";
import { useContratosList } from "@features/contratos-oxigeno/queries/useContratosList";
import { useNotificarContratos } from "@features/contratos-oxigeno/mutations/useNotificarContratos";
import type { ContratoOxigeno } from "@api/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseEmails(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@"));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  /** Contrato pre-seleccionado (desde click en fila) */
  preselected?:  ContratoOxigeno | null;
}

type Tab = "vencer" | "libre";

// ── Componente ────────────────────────────────────────────────────────────────

export function NotificacionesDrawer({ open, onOpenChange, preselected }: Props) {
  const [tab, setTab] = useState<Tab>("vencer");

  // ── Tab "Por vencer" ───────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());
  const [destVencer,  setDestVencer]    = useState("");
  const [asuntoVencer, setAsuntoVencer] = useState("Aviso de vencimiento de contratos");
  const [introVencer, setIntroVencer]   = useState(
    "Le informamos que los siguientes contratos de equipo médico domiciliario requieren atención próxima.",
  );

  // ── Tab "Redactar libre" ───────────────────────────────────────────────────
  const [destLibre,   setDestLibre]  = useState("");
  const [asuntoLibre, setAsuntoLibre] = useState("");
  const [cuerpoLibre, setCuerpoLibre] = useState("");
  const [adjuntos,    setAdjuntos]   = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Reset al abrir ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTab(preselected ? "vencer" : "vencer");
    setSelectedIds(preselected ? new Set([preselected.id]) : new Set());
    setDestVencer("");
    setDestLibre("");
    setAdjuntos([]);
    setCuerpoLibre("");
  }, [open, preselected]);

  // ── Contratos por vencer ───────────────────────────────────────────────────
  const { data: vencerData, isLoading: vencerLoading } = useContratosList(
    { status: "POR_VENCER", pageSize: 100, ordering: "dias_faltan" },
    { enabled: open },
  );
  const porVencer = vencerData?.items ?? [];

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () => {
    if (selectedIds.size === porVencer.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(porVencer.map((c) => c.id)));
    }
  };

  // ── Mutation ───────────────────────────────────────────────────────────────
  const notificar = useNotificarContratos();

  const handleEnviarVencer = async () => {
    const emails = parseEmails(destVencer);
    if (!emails.length) { toast.error("Ingresá al menos un correo válido."); return; }
    if (!selectedIds.size) { toast.error("Seleccioná al menos un contrato."); return; }
    try {
      const r = await notificar.mutateAsync({
        payload: {
          destinatarios: emails,
          asunto:        asuntoVencer,
          cuerpo:        introVencer,
          contratosIds:  [...selectedIds],
        },
      });
      toast.success(`Aviso enviado a ${r.enviados} destinatario${r.enviados !== 1 ? "s" : ""}.`);
      onOpenChange(false);
    } catch {
      toast.error("No se pudo enviar el aviso. Verificá la configuración de email.");
    }
  };

  const handleEnviarLibre = async () => {
    const emails = parseEmails(destLibre);
    if (!emails.length) { toast.error("Ingresá al menos un correo válido."); return; }
    if (!asuntoLibre.trim()) { toast.error("El asunto es requerido."); return; }
    try {
      const r = await notificar.mutateAsync({
        payload: { destinatarios: emails, asunto: asuntoLibre, cuerpo: cuerpoLibre },
        adjuntos: adjuntos.length > 0 ? adjuntos : undefined,
      });
      toast.success(`Correo enviado a ${r.enviados} destinatario${r.enviados !== 1 ? "s" : ""}.`);
      onOpenChange(false);
    } catch {
      toast.error("No se pudo enviar el correo. Verificá la configuración de email.");
    }
  };

  const isSending = notificar.isPending;

  const tabCls = (t: Tab) =>
    `flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
      tab === t ? "bg-paper text-txt-body shadow-sm" : "text-txt-muted hover:text-txt-body"
    }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col sm:max-w-xl">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <DialogTitle>Notificaciones por correo</DialogTitle>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="shrink-0 flex items-center gap-1 rounded-xl border border-line-struct bg-subtle/20 p-1 mx-1">
          <button type="button" className={tabCls("vencer")} onClick={() => setTab("vencer")}>
            <AlertCircle className="size-3.5" /> Por vencer
            {porVencer.length > 0 && (
              <Badge variant="alert" className="ml-1 text-[9px] py-0 px-1">{porVencer.length}</Badge>
            )}
          </button>
          <button type="button" className={tabCls("libre")} onClick={() => setTab("libre")}>
            <Send className="size-3.5" /> Redactar libre
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto px-1 space-y-4 pb-2">

          {/* ── TAB: POR VENCER ──────────────────────────────────────────── */}
          {tab === "vencer" && (
            <>
              {/* Lista de contratos */}
              <div className="rounded-xl border border-line-struct overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-subtle/20 border-b border-line-struct/50">
                  <p className="text-xs font-semibold text-txt-muted uppercase tracking-wide">
                    Contratos por vencer (≤ 15 días)
                  </p>
                  {porVencer.length > 0 && (
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={toggleAll}
                    >
                      {selectedIds.size === porVencer.length ? (
                        <><CheckSquare className="size-3.5" /> Deseleccionar todo</>
                      ) : (
                        <><Square className="size-3.5" /> Seleccionar todo</>
                      )}
                    </button>
                  )}
                </div>

                {vencerLoading ? (
                  <div className="flex items-center gap-2 p-4 text-xs text-txt-muted">
                    <Loader2 className="size-3.5 animate-spin" /> Cargando...
                  </div>
                ) : porVencer.length === 0 ? (
                  <p className="p-4 text-xs text-txt-muted italic">
                    No hay contratos por vencer en los próximos 15 días.
                  </p>
                ) : (
                  <div className="max-h-52 overflow-y-auto">
                    {porVencer.map((c) => {
                      const checked = selectedIds.has(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left border-b border-line-struct/30 last:border-0 transition-colors ${
                            checked ? "bg-primary/5" : "hover:bg-subtle/30"
                          }`}
                          onClick={() => toggleSelect(c.id)}
                        >
                          <div className={`size-4 shrink-0 rounded border-2 flex items-center justify-center ${
                            checked ? "border-primary bg-primary" : "border-line-struct"
                          }`}>
                            {checked && <span className="size-2 rounded-sm bg-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-txt-body truncate">
                              <span className="font-mono text-primary">{c.numContrato}</span>
                              {" — "}{c.nombre}
                            </p>
                            <p className="text-[10px] text-txt-muted">
                              {c.servicio} · Vence {formatDate(c.fechaRenovar)}
                            </p>
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${
                            (c.diasFaltan ?? 99) <= 0 ? "text-red-600" : "text-amber-600"
                          }`}>
                            {c.diasFaltan != null ? `${c.diasFaltan}d` : "—"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Configuración del email */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Destinatarios *</Label>
                  <Input
                    className="h-9 text-sm"
                    placeholder="correo1@gmail.com, correo2@gmail.com"
                    value={destVencer}
                    onChange={(e) => setDestVencer(e.target.value)}
                  />
                  <p className="text-[10px] text-txt-muted">Separados por coma, punto y coma o espacio</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Asunto *</Label>
                  <Input className="h-9 text-sm" value={asuntoVencer} onChange={(e) => setAsuntoVencer(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensaje introductorio</Label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-line-struct bg-paper px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    value={introVencer}
                    onChange={(e) => setIntroVencer(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full gap-2"
                disabled={isSending || !selectedIds.size || !parseEmails(destVencer).length}
                onClick={() => void handleEnviarVencer()}
              >
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Enviar aviso ({selectedIds.size} contrato{selectedIds.size !== 1 ? "s" : ""})
              </Button>
            </>
          )}

          {/* ── TAB: REDACTAR LIBRE ───────────────────────────────────────── */}
          {tab === "libre" && (
            <>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Destinatarios *</Label>
                  <Input
                    className="h-9 text-sm"
                    placeholder="correo1@gmail.com, correo2@gmail.com"
                    value={destLibre}
                    onChange={(e) => setDestLibre(e.target.value)}
                  />
                  <p className="text-[10px] text-txt-muted">Separados por coma, punto y coma o espacio</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Asunto *</Label>
                  <Input className="h-9 text-sm" value={asuntoLibre} onChange={(e) => setAsuntoLibre(e.target.value)} placeholder="Asunto del correo" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mensaje</Label>
                  <textarea
                    rows={6}
                    className="w-full rounded-md border border-line-struct bg-paper px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Escribí tu mensaje aquí..."
                    value={cuerpoLibre}
                    onChange={(e) => setCuerpoLibre(e.target.value)}
                  />
                </div>

                {/* Adjuntos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Archivos adjuntos</Label>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Paperclip className="size-3.5" /> Adjuntar archivo
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          setAdjuntos((prev) => [...prev, ...Array.from(e.target.files!)]);
                        }
                      }}
                    />
                  </div>
                  {adjuntos.length > 0 && (
                    <div className="space-y-1">
                      {adjuntos.map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-line-struct/50 bg-subtle/20 px-3 py-1.5 text-xs">
                          <span className="truncate text-txt-body">{f.name}</span>
                          <button
                            type="button"
                            className="ml-2 shrink-0 text-txt-muted hover:text-red-500"
                            onClick={() => setAdjuntos((prev) => prev.filter((_, j) => j !== i))}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="button"
                className="w-full gap-2"
                disabled={isSending || !parseEmails(destLibre).length || !asuntoLibre.trim()}
                onClick={() => void handleEnviarLibre()}
              >
                {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Enviar correo
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
