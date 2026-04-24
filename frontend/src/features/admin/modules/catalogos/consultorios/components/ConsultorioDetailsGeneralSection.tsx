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
import type { ConsultorioDetail } from "@api/types";
import {
  CATALOG_STATUS,
  type CatalogStatus,
} from "@features/admin/modules/catalogos/shared/domain/catalog-status";
import type { ConsultorioDetailsFormValues } from "@features/admin/modules/catalogos/consultorios/domain/consultorios.schemas";
import { CatalogFkCombobox } from "@features/admin/modules/catalogos/shared/components/CatalogFkCombobox";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useTurnosList } from "@features/admin/modules/catalogos/turnos/queries/useTurnosList";

interface ConsultorioDetailsGeneralSectionProps {
  form: UseFormReturn<ConsultorioDetailsFormValues>;
  formId: string;
  consultorioDetail: ConsultorioDetail;
  onSubmit: (values: ConsultorioDetailsFormValues) => void;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

export function ConsultorioDetailsGeneralSection({
  form,
  formId,
  consultorioDetail,
  onSubmit,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: ConsultorioDetailsGeneralSectionProps) {
  const statusValue: CatalogStatus = consultorioDetail.isActive
    ? CATALOG_STATUS.ACTIVE
    : CATALOG_STATUS.INACTIVE;

  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centrosOptions = (centrosData?.items ?? []).map((c) => ({ id: c.id, name: c.name }));

  const { data: turnosData } = useTurnosList({ isActive: true });
  const turnosOptions = (turnosData?.items ?? []).map((t) => ({ id: t.id, name: t.name }));

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
                <FormLabel>Nombre del consultorio</FormLabel>
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
                  <Input
                    {...field}
                    type="number"
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    disabled={!isEditable}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="idTurn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turno</FormLabel>
                <FormControl>
                  <CatalogFkCombobox
                    options={turnosOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecciona un turno"
                    searchPlaceholder="Buscar turno..."
                    disabled={!isEditable}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="idCenter"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de atención</FormLabel>
                <FormControl>
                  <CatalogFkCombobox
                    options={centrosOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecciona un centro"
                    searchPlaceholder="Buscar centro..."
                    disabled={!isEditable}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>ID</Label>
            <Input value={consultorioDetail.id.toString()} disabled />
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
