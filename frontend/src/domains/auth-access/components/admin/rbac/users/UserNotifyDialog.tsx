import { useEffect, useState } from "react";
import { Loader2, Mail, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Separator } from "@shared/ui/separator";
import { Textarea } from "@shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ScrollArea } from "@shared/ui/ScrollArea";
import { useNotifyUsers, useNotifyUsersPreview } from "@/domains/auth-access/hooks/rbac/users/useNotifyUsers";
import type { CentroAtencionListItem, RoleListItem, NotifyUsersRequest } from "@api/types";

interface UserNotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: RoleListItem[];
  clinicOptions: CentroAtencionListItem[];
}

const EMPTY_FILTERS = { cdLaboral: "", roleId: "", clinicId: "" };

export function UserNotifyDialog({
  open,
  onOpenChange,
  roleOptions,
  clinicOptions,
}: UserNotifyDialogProps) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [previewPayload, setPreviewPayload] = useState<NotifyUsersRequest | null>(null);

  const notify = useNotifyUsers();
  const { data: preview, isFetching: isLoadingPreview } = useNotifyUsersPreview(previewPayload);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setSubject("");
      setCategory("");
      setMessage("");
      setFilters(EMPTY_FILTERS);
      setPreviewPayload(null);
    }
  }, [open]);

  const buildPayload = (): NotifyUsersRequest => ({
    subject: subject.trim(),
    message: message.trim(),
    category: category.trim() || undefined,
    cdLaboral: filters.cdLaboral.trim() || undefined,
    roleId: filters.roleId ? Number(filters.roleId) : undefined,
    clinicId: filters.clinicId ? Number(filters.clinicId) : undefined,
  });

  const handlePreview = () => {
    if (!subject.trim() || !message.trim()) return;
    setPreviewPayload(buildPayload());
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    try {
      const result = await notify.mutateAsync(buildPayload());
      toast.success("Notificación enviada", {
        description: `Se está enviando el correo a ${result.queued} usuario${result.queued !== 1 ? "s" : ""} en segundo plano.`,
      });
      onOpenChange(false);
    } catch {
      toast.error("No se pudo enviar la notificación", {
        description: "Verificá los filtros o intentá nuevamente.",
      });
    }
  };

  const hasActiveFilters = filters.cdLaboral || filters.roleId || filters.clinicId;
  const canSend = subject.trim().length > 0 && message.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="w-[96vw] max-w-none overflow-hidden rounded-3xl bg-paper p-0 sm:max-w-[620px]"
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Mail className="size-4 text-txt-muted" />
            Enviar notificación por correo
          </DialogTitle>
          <DialogDescription className="text-sm text-txt-muted">
            Filtrá los destinatarios y redactá el mensaje. El envío corre en segundo plano.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 pb-2">
          <div className="space-y-5 py-4">

            {/* Filtros */}
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
                Filtrar destinatarios
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Clave laboral</Label>
                  <Input
                    value={filters.cdLaboral}
                    onChange={(e) => setFilters((f) => ({ ...f, cdLaboral: e.target.value }))}
                    placeholder="Ej. HON, BASE..."
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rol</Label>
                  <Select
                    value={filters.roleId}
                    onValueChange={(v) => setFilters((f) => ({ ...f, roleId: v === "all" ? "" : v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      {roleOptions.map((r) => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Centro</Label>
                  <Select
                    value={filters.clinicId}
                    onValueChange={(v) => setFilters((f) => ({ ...f, clinicId: v === "all" ? "" : v }))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los centros</SelectItem>
                      {clinicOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview de destinatarios */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  disabled={isLoadingPreview || !canSend}
                  onClick={handlePreview}
                >
                  {isLoadingPreview ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Users className="size-3.5" />
                  )}
                  Ver destinatarios
                </Button>
                {preview !== undefined ? (
                  <p className="text-sm text-txt-body">
                    <span className="font-semibold">{preview.count}</span>{" "}
                    usuario{preview.count !== 1 ? "s" : ""} recibirán este correo
                    {hasActiveFilters ? " con los filtros aplicados" : ""}
                  </p>
                ) : null}
              </div>
            </div>

            <Separator />

            {/* Composición */}
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
                Mensaje
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">Asunto <span className="text-status-critical">*</span></Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej. Recordatorio de actualización de datos"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Categoría <span className="text-txt-muted">(opcional — aparece en el encabezado del correo)</span></Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej. Personal Honorario, Área Clínica..."
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mensaje <span className="text-status-critical">*</span></Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribí el mensaje que recibirán los usuarios..."
                  rows={5}
                  className="resize-none"
                  maxLength={2000}
                />
                <p className="text-right text-xs text-txt-muted">{message.length}/2000</p>
              </div>
            </div>

          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col gap-2 border-t border-line-struct px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-txt-muted">
            El envío se procesa en segundo plano. No cerrés el sistema hasta confirmar.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={notify.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!canSend || notify.isPending}
              onClick={() => void handleSend()}
              className="gap-2"
            >
              {notify.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Mail className="size-4" />
              )}
              Enviar notificación
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
