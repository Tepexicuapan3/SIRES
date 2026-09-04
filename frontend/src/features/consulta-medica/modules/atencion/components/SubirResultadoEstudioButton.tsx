import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
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
import { Textarea } from "@shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { estudiosMedicosAPI } from "@api/resources/catalogos/estudios-medicos.api";
import { useCreateStudyResult } from "@features/consulta-medica/modules/atencion/mutations/useCreateStudyResult";

const SUBIR_RESULTADO_DOMAIN_ERROR_MESSAGE: Record<string, string> = {
  ROLE_NOT_ALLOWED: "No tenes permiso para subir resultados de estudios.",
  VISIT_NOT_FOUND: "La visita ya no existe o fue cerrada por otro usuario.",
  CONSULTATION_NOT_FOUND: "Primero guarda el diagnostico de esta consulta.",
  VALIDATION_ERROR: "Revisa los datos capturados antes de subir el resultado.",
  PERMISSION_DENIED: "No tenes permiso para ejecutar esta accion.",
};

const FALLBACK_SUBIR_RESULTADO_ERROR_MESSAGE =
  "No se pudo subir el resultado. Intenta nuevamente.";

const resolveSubirResultadoError = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    return FALLBACK_SUBIR_RESULTADO_ERROR_MESSAGE;
  }
  return (
    SUBIR_RESULTADO_DOMAIN_ERROR_MESSAGE[error.code] ||
    error.message ||
    FALLBACK_SUBIR_RESULTADO_ERROR_MESSAGE
  );
};

const subirResultadoSchema = z.object({
  studyTypeId: z.string().min(1, { error: "Selecciona un tipo de estudio" }),
  resultDate: z.string().min(1, { error: "Selecciona una fecha" }),
  notes: z.string().optional(),
});

type SubirResultadoFormValues = z.infer<typeof subirResultadoSchema>;

const buildDefaultValues = (): SubirResultadoFormValues => ({
  studyTypeId: "",
  resultDate: new Date().toISOString().slice(0, 10),
  notes: "",
});

interface SubirResultadoEstudioButtonProps {
  visitId: number;
  disabled?: boolean;
}

export function SubirResultadoEstudioButton({
  visitId,
  disabled,
}: SubirResultadoEstudioButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const createStudyResult = useCreateStudyResult();

  const { data: tiposEstudio } = useQuery({
    queryKey: ["catalogos", "estudios-medicos", "options"],
    queryFn: () => estudiosMedicosAPI.getAll({ pageSize: 200 }),
    enabled: open,
  });

  const form = useForm<SubirResultadoFormValues>({
    resolver: zodResolver(subirResultadoSchema),
    defaultValues: buildDefaultValues(),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(buildDefaultValues());
      setFile(null);
    }
    setOpen(nextOpen);
  };

  const onSubmit = async (values: SubirResultadoFormValues) => {
    if (!file) {
      toast.error("Selecciona un archivo antes de subir el resultado.");
      return;
    }

    try {
      await createStudyResult.mutateAsync({
        visitId,
        data: {
          studyTypeId: Number(values.studyTypeId),
          resultDate: values.resultDate,
          notes: values.notes || undefined,
          file,
        },
      });
      toast.success("Resultado de estudio subido");
      handleOpenChange(false);
    } catch (error) {
      toast.error("No se pudo subir el resultado", {
        description: resolveSubirResultadoError(error),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}>
          <FileUp className="mr-2 size-4" />
          Subir resultado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir resultado de estudio</DialogTitle>
          <DialogDescription>
            PDF, JPG, PNG o WEBP, máximo 8 MB. Se asocia al diagnóstico ya
            guardado de esta consulta.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="studyTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de estudio</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un estudio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(tiposEstudio?.items ?? []).map((tipo) => (
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

            <FormField
              control={form.control}
              name="resultDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del resultado</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Archivo</FormLabel>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              {!file ? (
                <p className="text-xs text-txt-muted">
                  Selecciona el archivo con el resultado.
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createStudyResult.isPending}>
                {createStudyResult.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : null}
                Subir
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
