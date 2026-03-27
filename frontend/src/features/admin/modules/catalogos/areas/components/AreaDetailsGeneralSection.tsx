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
import type { AreaDetail } from "@api/types";
import {
  CATALOG_STATUS,
  type CatalogStatus,
} from "@features/admin/modules/catalogos/shared/domain/catalog-status";
import type { AreaDetailsFormValues } from "@features/admin/modules/catalogos/areas/domain/areas.schemas";

interface AreaDetailsGeneralSectionProps {
  form: UseFormReturn<AreaDetailsFormValues>;
  formId: string;
  areaDetail: AreaDetail;
  onSubmit: (values: AreaDetailsFormValues) => void;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

export function AreaDetailsGeneralSection({
  form,
  formId,
  areaDetail,
  onSubmit,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: AreaDetailsGeneralSectionProps) {
  const statusValue: CatalogStatus = areaDetail.isActive
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
                <FormLabel>Nombre del area</FormLabel>
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
                <FormLabel>Codigo</FormLabel>
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
            <Input value={areaDetail.id.toString()} disabled />
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
                <SelectItem value={CATALOG_STATUS.INACTIVE}>
                  Inactivo
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
