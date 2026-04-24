import type { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Separator } from "@shared/ui/separator";
import type { InventarioVacunaDetail } from "@api/types";
import {
  CATALOG_STATUS,
  type CatalogStatus,
} from "@features/admin/modules/catalogos/shared/domain/catalog-status";
import type { UpdateInventarioFormValues } from "../domain/inventario-vacunas.schemas";

interface InventarioDetailsGeneralSectionProps {
  form: UseFormReturn<UpdateInventarioFormValues>;
  formId: string;
  detail: InventarioVacunaDetail;
  onSubmit: (values: UpdateInventarioFormValues) => void;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

export function InventarioDetailsGeneralSection({
  form,
  formId,
  detail,
  onSubmit,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: InventarioDetailsGeneralSectionProps) {
  const statusValue: CatalogStatus = detail.isActive
    ? CATALOG_STATUS.ACTIVE
    : CATALOG_STATUS.INACTIVE;

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Vacuna</Label>
            <Input value={detail.vaccine.name} disabled />
          </div>
          <div className="space-y-2">
            <Label>Centro de atención</Label>
            <Input value={detail.center.name} disabled />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Existencia</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    disabled={!isEditable}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label>Dosis aplicadas</Label>
            <Input value={detail.appliedDoses} disabled title="Campo de solo lectura, gestionado por el módulo de vacunación" />
          </div>
          <div className="space-y-2">
            <Label>Disponibles</Label>
            <Input value={detail.availableDoses} disabled />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>ID</Label>
            <Input value={detail.id.toString()} disabled />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={statusValue}
              onValueChange={(value) => {
                if (!onStatusChange || !isEditable) return;
                if (value === statusValue) return;
                onStatusChange(value === CATALOG_STATUS.ACTIVE);
              }}
              disabled={!onStatusChange || isStatusPending || !isEditable}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CATALOG_STATUS.ACTIVE}>Activo</SelectItem>
                <SelectItem value={CATALOG_STATUS.INACTIVE}>Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />
      </form>
    </Form>
  );
}
