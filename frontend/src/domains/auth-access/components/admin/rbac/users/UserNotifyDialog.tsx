import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, ChevronsUpDown, File as FileIcon, Loader2, Mail, Paperclip, Search, Users, X } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
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
import { cn } from "@shared/utils/styling/cn";
import { useDebounce } from "@shared/hooks/useDebounce";
import { useNotifyUsers, useNotifyUsersPreview } from "@/domains/auth-access/hooks/rbac/users/useNotifyUsers";
import { useCdLaboralesList } from "@/domains/auth-access/hooks/rbac/users/useCdLaboralesList";
import { useUsersList } from "@/domains/auth-access/hooks/rbac/users/useUsersList";
import type { CentroAtencionListItem, NotifyFailedItem, NotifyUsersRequest } from "@api/types";

interface UserNotifyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicOptions: CentroAtencionListItem[];
}

interface SelectedUser {
  id: number;
  label: string;
}

const EMPTY_FILTERS = { cdLaboral: "", clinicId: "" };
const MAX_FILE_BYTES  = 10 * 1024 * 1024; // 10 MB por archivo
const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25 MB total (límite Gmail)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UserNotifyDialog({
  open,
  onOpenChange,
  clinicOptions,
}: UserNotifyDialogProps) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<NotifyUsersRequest | null>(null);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: NotifyFailedItem[] } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const userSearchRef = useRef<HTMLInputElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const notify = useNotifyUsers();
  const { data: preview, isFetching: isLoadingPreview } = useNotifyUsersPreview(previewPayload);
  const { data: cdLaboralesData } = useCdLaboralesList(open);
  const cdLaboralesOptions = cdLaboralesData?.items ?? [];

  const debouncedUserSearch = useDebounce(userSearch, 350);
  const { data: usersData, isFetching: isSearchingUsers } = useUsersList(
    { search: debouncedUserSearch, pageSize: 20, page: 1 },
    { enabled: open && userPopoverOpen && debouncedUserSearch.length >= 2 },
  );
  const userResults = useMemo(
    () => (usersData?.items ?? []).map((u) => ({
      id: u.id,
      label: u.fullname ? `${u.fullname} (${u.username})` : u.username,
    })),
    [usersData],
  );

  useEffect(() => {
    if (!open) {
      setSubject(""); setCategory(""); setMessage("");
      setFilters(EMPTY_FILTERS);
      setSelectedUser(null); setUserSearch("");
      setPreviewPayload(null);
      setSendResult(null);
      setFiles([]);
    }
  }, [open]);

  const buildPayload = (): NotifyUsersRequest => ({
    subject: subject.trim(),
    message: message.trim(),
    category: category.trim() || undefined,
    cdLaboral: filters.cdLaboral || undefined,
    userId: selectedUser?.id ?? undefined,
    clinicId: filters.clinicId ? Number(filters.clinicId) : undefined,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...incoming]);
    // Resetear para que el mismo archivo pueda elegirse de nuevo si se quitó
    e.target.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalSize        = files.reduce((acc, f) => acc + f.size, 0);
  const hasFileSizeError = files.some((f) => f.size > MAX_FILE_BYTES);
  const totalSizeExceeded = totalSize > MAX_TOTAL_BYTES;

  const handlePreview = () => {
    if (!subject.trim() || !message.trim()) return;
    setPreviewPayload(buildPayload());
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSendResult(null);
    try {
      const result = await notify.mutateAsync({ data: buildPayload(), files });
      setSendResult(result);
      if (result.failed.length === 0) {
        toast.success(
          `${result.sent} correo${result.sent !== 1 ? "s" : ""} enviado${result.sent !== 1 ? "s" : ""} correctamente.`,
        );
        onOpenChange(false);
      }
    } catch {
      toast.error("No se pudo enviar la notificación", {
        description: "Verificá los filtros o intentá nuevamente.",
      });
    }
  };

  const hasActiveFilters = filters.cdLaboral || filters.clinicId || selectedUser;
  const canSend =
    subject.trim().length > 0 &&
    message.trim().length > 0 &&
    !hasFileSizeError &&
    !totalSizeExceeded;

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
            Filtrá los destinatarios y redactá el mensaje.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 pb-2">
          <div className="space-y-5 py-4">

            {/* ── Filtros ─────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
                Filtrar destinatarios
              </p>
              <div className="grid gap-3 sm:grid-cols-3">

                {/* Clave laboral */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Clave laboral</Label>
                  <Select
                    value={filters.cdLaboral}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, cdLaboral: v === "all" ? "" : v }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {cdLaboralesOptions.map((clave) => (
                        <SelectItem key={clave} value={clave}>
                          {clave}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Centro */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Centro</Label>
                  <Select
                    value={filters.clinicId}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, clinicId: v === "all" ? "" : v }))
                    }
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

                {/* Usuario específico */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Usuario específico</Label>
                  <Popover
                    open={userPopoverOpen}
                    onOpenChange={(next) => {
                      setUserPopoverOpen(next);
                      if (next) setTimeout(() => userSearchRef.current?.focus(), 0);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "h-9 w-full justify-between font-normal",
                          !selectedUser && "text-txt-muted",
                        )}
                      >
                        <span className="truncate">
                          {selectedUser ? selectedUser.label : "Buscar usuario"}
                        </span>
                        <div className="ml-1 flex shrink-0 items-center gap-1">
                          {selectedUser ? (
                            <span
                              role="button"
                              tabIndex={-1}
                              className="rounded p-0.5 text-txt-muted hover:text-txt-body"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUser(null);
                                setUserSearch("");
                              }}
                            >
                              <X className="size-3" />
                            </span>
                          ) : null}
                          <ChevronsUpDown className="size-3.5 opacity-50" />
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" sideOffset={4} className="w-72 p-0">
                      <div className="flex items-center gap-2 border-b border-line-struct px-3 py-2">
                        <Search className="size-4 shrink-0 text-txt-muted" />
                        <Input
                          ref={userSearchRef}
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Nombre o usuario..."
                          className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                        />
                        {isSearchingUsers ? (
                          <Loader2 className="size-3.5 shrink-0 animate-spin text-txt-muted" />
                        ) : null}
                      </div>
                      <div className="max-h-52 overflow-y-auto py-1">
                        {debouncedUserSearch.length < 2 ? (
                          <p className="px-3 py-3 text-center text-xs text-txt-muted">
                            Escribí al menos 2 caracteres
                          </p>
                        ) : userResults.length === 0 && !isSearchingUsers ? (
                          <p className="px-3 py-3 text-center text-xs text-txt-muted">
                            Sin resultados para &quot;{debouncedUserSearch}&quot;
                          </p>
                        ) : (
                          userResults.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-subtle/40",
                                selectedUser?.id === u.id && "font-medium",
                              )}
                              onClick={() => {
                                setSelectedUser(u);
                                setUserPopoverOpen(false);
                                setUserSearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "size-4 shrink-0",
                                  selectedUser?.id === u.id
                                    ? "text-primary opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              <span className="truncate">{u.label}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
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

            {/* ── Composición ─────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
                Mensaje
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Asunto <span className="text-status-critical">*</span>
                </Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej. Recordatorio de actualización de datos"
                  maxLength={120}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Categoría{" "}
                  <span className="text-txt-muted">(opcional — encabezado del correo)</span>
                </Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej. Personal Honorario, Área Clínica..."
                  maxLength={60}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Mensaje <span className="text-status-critical">*</span>
                </Label>
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

            <Separator />

            {/* ── Adjuntos ─────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
                Archivos adjuntos{" "}
                <span className="font-normal normal-case">(opcional)</span>
              </p>

              {/* Input nativo oculto */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Lista de archivos seleccionados */}
              {files.length > 0 ? (
                <div className="space-y-1.5">
                  {files.map((file, idx) => {
                    const sizeExceeded = file.size > MAX_FILE_BYTES;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                          sizeExceeded
                            ? "border-status-critical/40 bg-status-critical/5"
                            : "border-line-struct bg-subtle/20",
                        )}
                      >
                        <FileIcon className="size-4 shrink-0 text-txt-muted" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-txt-body">{file.name}</p>
                          <p
                            className={cn(
                              "text-xs",
                              sizeExceeded ? "text-status-critical" : "text-txt-muted",
                            )}
                          >
                            {formatFileSize(file.size)}
                            {sizeExceeded ? " — supera el límite de 10 MB" : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="shrink-0 rounded p-0.5 text-txt-muted hover:text-txt-body"
                          onClick={() => removeFile(idx)}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Resumen de tamaño total */}
                  {totalSizeExceeded ? (
                    <p className="text-xs text-status-critical">
                      El tamaño total ({formatFileSize(totalSize)}) supera el límite de 25 MB.
                    </p>
                  ) : (
                    <p className="text-xs text-txt-muted">
                      Total: {formatFileSize(totalSize)} / 25 MB
                    </p>
                  )}
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="size-3.5" />
                  Adjuntar archivos
                </Button>
                {files.length === 0 ? (
                  <p className="text-xs text-txt-muted">
                    Máx. 10 MB por archivo · 25 MB en total
                  </p>
                ) : null}
              </div>
            </div>

            {/* ── Resultados del envío ─────────────────────────── */}
            {sendResult ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
                    Resultado del envío
                  </p>

                  {sendResult.sent > 0 ? (
                    <div className="flex items-center gap-2 rounded-xl border border-status-stable/30 bg-status-stable/5 px-4 py-3">
                      <CheckCircle2 className="size-4 shrink-0 text-status-stable" />
                      <p className="text-sm text-txt-body">
                        <span className="font-semibold">{sendResult.sent}</span>{" "}
                        correo{sendResult.sent !== 1 ? "s" : ""} enviado{sendResult.sent !== 1 ? "s" : ""} correctamente.
                      </p>
                    </div>
                  ) : null}

                  {sendResult.failed.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 rounded-xl border border-status-alert/30 bg-status-alert/5 px-4 py-3">
                        <AlertTriangle className="size-4 shrink-0 text-status-alert" />
                        <p className="text-sm text-txt-body">
                          <span className="font-semibold">{sendResult.failed.length}</span>{" "}
                          correo{sendResult.failed.length !== 1 ? "s" : ""} no{" "}
                          {sendResult.failed.length !== 1 ? "se pudieron" : "se pudo"} enviar:
                        </p>
                      </div>
                      <div className="divide-y divide-line-struct/50 rounded-xl border border-line-struct bg-subtle/20">
                        {sendResult.failed.map((item) => (
                          <div key={item.email} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-txt-body">
                                {item.name || item.username}
                              </p>
                              <p className="truncate text-xs text-status-critical">
                                {item.email || "Sin correo registrado"}
                              </p>
                            </div>
                            <span className="shrink-0 font-mono text-xs text-txt-muted">
                              {item.username}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}

          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col gap-2 border-t border-line-struct px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-txt-muted">
            {notify.isPending ? "Enviando correos, por favor esperá..." : ""}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={notify.isPending}
            >
              Cerrar
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
              {notify.isPending ? "Enviando..." : "Enviar notificación"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
