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
import type { DiscapacidadDetail } from "@api/types";
import {
  CATALOG_STATUS,
  type CatalogStatus,
} from "@features/admin/modules/catalogos/shared/domain/catalog-status";
import type { DiscapacidadDetailsFormValues } from "@features/admin/modules/catalogos/discapacidades/domain/discapacidades.schemas";

interface DiscapacidadDetailsGeneralSectionProps {
  form: UseFormReturn<DiscapacidadDetailsFormValues>;
  formId: string;
  discapacidadDetail: DiscapacidadDetail;
  onSubmit: (values: DiscapacidadDetailsFormValues) => void;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

export function DiscapacidadDetailsGeneralSection({
  form,
  formId,
  discapacidadDetail,
  onSubmit,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: DiscapacidadDetailsGeneralSectionProps) {
  const statusValue: CatalogStatus = discapacidadDetail.isActive
    ? CATALOG_STATUS.ACTIVE
    : CATALOG_STATUS.INACTIVE;

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la discapacidad</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Clave</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>ID</Label>
            <Input value={discapacidadDetail.id.toString()} disabled />
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
                <SelectItem value={CATALOG_STATUS.ACTIVE}>Activa</SelectItem>
                <SelectItem value={CATALOG_STATUS.INACTIVE}>
                  Inactiva
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />
      </form>
    </Form>
  );
}
