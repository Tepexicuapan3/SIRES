import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
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
import { cn } from "@shared/utils/styling/cn";

const TIPO_LABELS: Record<string, string> = {
  PROFESIONAL: "Profesional",
  ESPECIALIDAD: "Especialidad",
  SUBESPECIALIDAD: "Subespecialidad",
};

interface CedulasSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  isEditable?: boolean;
}

export function CedulasSection({ form, isEditable = true }: CedulasSectionProps) {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "cedulas",
  });

  const canAdd = fields.length < 3;

  const handleSetPrincipal = (targetIndex: number) => {
    fields.forEach((_, idx) => {
      const current = form.getValues(`cedulas.${idx}`);
      update(idx, { ...current, esPrincipal: idx === targetIndex });
    });
  };

  const handleAdd = () => {
    if (!canAdd) return;
    append({ numero: "", tipo: "PROFESIONAL", esPrincipal: fields.length === 0 });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
          Cédulas profesionales
        </p>
        {isEditable && canAdd ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handleAdd}
          >
            <Plus className="size-3.5" />
            Agregar
          </Button>
        ) : null}
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-txt-muted italic">
          Sin cédulas registradas.
          {isEditable ? " Usa el botón «Agregar» para añadir." : ""}
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => {
            const esPrincipal = form.watch(`cedulas.${index}.esPrincipal`);

            return (
              <div
                key={field.id}
                className={cn(
                  "relative rounded-xl border p-3 space-y-3",
                  esPrincipal
                    ? "border-primary/40 bg-primary/5"
                    : "border-line-struct bg-paper",
                )}
              >
                {esPrincipal ? (
                  <span className="absolute right-3 top-3 flex items-center gap-1 text-xs font-medium text-primary">
                    <Star className="size-3 fill-current" />
                    Principal
                  </span>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`cedulas.${index}.numero`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Número</FormLabel>
                        <FormControl>
                          <Input
                            {...f}
                            placeholder="Ej. 1234567"
                            disabled={!isEditable}
                            className="h-9"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`cedulas.${index}.tipo`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Tipo</FormLabel>
                        <Select
                          value={f.value}
                          onValueChange={f.onChange}
                          disabled={!isEditable}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(TIPO_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isEditable ? (
                  <div className="flex items-center gap-2">
                    {!esPrincipal ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-txt-muted"
                        onClick={() => handleSetPrincipal(index)}
                      >
                        <Star className="size-3" />
                        Marcar como principal
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-7 gap-1 text-xs text-status-critical hover:text-status-critical"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-3" />
                      Eliminar
                    </Button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
