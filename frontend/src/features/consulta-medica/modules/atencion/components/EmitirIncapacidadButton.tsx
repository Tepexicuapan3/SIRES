import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarOff, Loader2 } from "lucide-react";
import * as z from "zod";
import { ApiError } from "@api/utils/errors";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Switch } from "@shared/ui/switch";
import { Label } from "@shared/ui/label";
import { licenciasAPI } from "@api/resources/catalogos/licencias.api";
import { useCreateMedicalLeave } from "@features/consulta-medica/modules/atencion/mutations/useCreateMedicalLeave";

const EMITIR_INCAPACIDAD_DOMAIN_ERROR_MESSAGE: Record<string, string> = {
  ROLE_NOT_ALLOWED: "No tenes permiso para emitir incapacidades.",
  VISIT_NOT_FOUND: "La visita ya no existe o fue cerrada por otro usuario.",
  LEAVE_TITULAR_ONLY: "Solo el titular puede recibir una incapacidad, no un familiar.",
  CONSULTATION_NOT_FOUND: "Primero guarda el diagnostico de esta consulta.",
  LEAVE_ALREADY_EXISTS: "Ya existe una incapacidad activa para esta consulta.",
  LEAVE_OVERLAP: "El paciente ya cuenta con una incapacidad vigente.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de emitir.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
};

const FALLBACK_EMITIR_INCAPACIDAD_ERROR_MESSAGE =
  "No se pudo emitir la incapacidad. Intenta nuevamente.";

const resolveEmitirIncapacidadError = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return FALLBACK_EMITIR_INCAPACIDAD_ERROR_MESSAGE;
  }
  return (
    EMITIR_INCAPACIDAD_DOMAIN_ERROR_MESSAGE[error.code] ||
    error.message ||
    FALLBACK_EMITIR_INCAPACIDAD_ERROR_MESSAGE
  );
};

const emitirIncapacidadSchema = z.object({
  leaveTypeId: z.string().min(1, { error: "Selecciona un tipo" }),
  days: z.number().int().min(1, { error: "Minimo 1 dia" }).max(180),
  startDate: z.string().min(1, { error: "Selecciona una fecha" }),
  isSubsequent: z.boolean(),
});

type EmitirIncapacidadFormValues = z.infer<typeof emitirIncapacidadSchema>;

const buildDefaultValues = (): EmitirIncapacidadFormValues => ({
  leaveTypeId: "",
  days: 1,
  startDate: new Date().toISOString().slice(0, 10),
  isSubsequent: false,
});

interface EmitirIncapacidadButtonProps {
  visitId: number;
  disabled?: boolean;
}

export function EmitirIncapacidadButton({
  visitId,
  disabled,
}: EmitirIncapacidadButtonProps) {
  const [open, setOpen] = useState(false);
  const createMedicalLeave = useCreateMedicalLeave();

  const { data: tiposLicencia } = useQuery({
    queryKey: ["catalogos", "licencias", "options"],
    queryFn: () => licenciasAPI.getAll({ pageSize: 100 }),
    enabled: open,
  });

  const form = useForm<EmitirIncapacidadFormValues>({
    resolver: zodResolver(emitirIncapacidadSchema),
    defaultValues: buildDefaultValues(),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(buildDefaultValues());
    }
    setOpen(nextOpen);
  };

  const onSubmit = async (values: EmitirIncapacidadFormValues) => {
    try {
      const leave = await createMedicalLeave.mutateAsync({
        visitId,
        data: {
          leaveTypeId: Number(values.leaveTypeId),
          days: values.days,
          startDate: values.startDate,
          isSubsequent: values.isSubsequent,
        },
      });
      toast.success("Incapacidad emitida", {
        description: `Folio ${leave.folio} — ${leave.days} día(s) a partir del ${leave.startDate}.`,
      });
      handleOpenChange(false);
    } catch (error) {
      toast.error("No se pudo emitir la incapacidad", {
        description: resolveEmitirIncapacidadError(error),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <CalendarOff className="mr-2 size-4" />
          Emitir incapacidad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Emitir incapacidad</DialogTitle>
          <DialogDescription>
            Se emite sobre el diagnóstico ya guardado de esta consulta. Solo
            aplica para el titular.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de licencia</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(tiposLicencia?.items ?? []).map((tipo) => (
                        <SelectItem key={tipo.id} value={String(tipo.id)}>
                          {tipo.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={180}
                        {...field}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isSubsequent"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Es subsecuente (continúa una incapacidad previa)</Label>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMedicalLeave.isPending}>
                {createMedicalLeave.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Emitir
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
