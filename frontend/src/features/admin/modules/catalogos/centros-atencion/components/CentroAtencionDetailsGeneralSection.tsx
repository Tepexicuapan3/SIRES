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
import type { CentroAtencionDetail } from "@api/types";
import {
  CATALOG_STATUS,
  type CatalogStatus,
} from "@features/admin/modules/catalogos/shared/domain/catalog-status";
import type { CentroAtencionDetailsFormValues } from "@features/admin/modules/catalogos/centros-atencion/domain/centros-atencion.schemas";

interface CentroAtencionDetailsGeneralSectionProps {
  form: UseFormReturn<CentroAtencionDetailsFormValues>;
  formId: string;
  centerDetail: CentroAtencionDetail;
  onSubmit: (values: CentroAtencionDetailsFormValues) => void;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

const CENTER_TYPE = {
  INTERNAL: "internal",
  EXTERNAL: "external",
} as const;

const buildScheduleFields = (
  prefix: "morning" | "afternoon" | "night",
  label: string,
) => {
  const startsAtField = `${prefix}StartsAt` as const;
  const endsAtField = `${prefix}EndsAt` as const;

  return {
    label,
    startsAtField,
    endsAtField,
  };
};

const SCHEDULE_FIELDS = [
  buildScheduleFields("morning", "Turno matutino"),
  buildScheduleFields("afternoon", "Turno vespertino"),
  buildScheduleFields("night", "Turno nocturno"),
] as const;

export function CentroAtencionDetailsGeneralSection({
  form,
  formId,
  centerDetail,
  onSubmit,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: CentroAtencionDetailsGeneralSectionProps) {
  const statusValue: CatalogStatus = centerDetail.isActive
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
                <FormLabel>Nombre del centro</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="folioCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Folio</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={!isEditable}
                    onChange={(event) =>
                      field.onChange(event.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Direccion</FormLabel>
              <FormControl>
                <Input {...field} disabled={!isEditable} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>ID</Label>
            <Input value={centerDetail.id.toString()} disabled />
          </div>

          <FormField
            control={form.control}
            name="isExternal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  value={
                    field.value ? CENTER_TYPE.EXTERNAL : CENTER_TYPE.INTERNAL
                  }
                  onValueChange={(value) =>
                    field.onChange(value === CENTER_TYPE.EXTERNAL)
                  }
                  disabled={!isEditable}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CENTER_TYPE.INTERNAL}>
                      Interno
                    </SelectItem>
                    <SelectItem value={CENTER_TYPE.EXTERNAL}>
                      Externo
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-txt-body">Horarios</h4>
          <div className="grid gap-4">
            {SCHEDULE_FIELDS.map((scheduleField) => (
              <div
                key={scheduleField.label}
                className="grid gap-3 rounded-xl border border-line-struct/60 bg-subtle/20 p-3 sm:grid-cols-2"
              >
                <FormField
                  control={form.control}
                  name={scheduleField.startsAtField}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${scheduleField.label} inicia`}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} disabled={!isEditable} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={scheduleField.endsAtField}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{`${scheduleField.label} termina`}</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} disabled={!isEditable} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />
      </form>
    </Form>
  );
}
