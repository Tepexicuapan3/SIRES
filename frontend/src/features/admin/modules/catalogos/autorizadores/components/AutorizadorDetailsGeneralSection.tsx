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
import type { AutorizadorDetail } from "@api/types";
import {
  CATALOG_STATUS,
  type CatalogStatus,
} from "@features/admin/modules/catalogos/shared/domain/catalog-status";
import type { AutorizadorDetailsFormValues } from "@features/admin/modules/catalogos/autorizadores/domain/autorizadores.schemas";
import { CatalogFkCombobox } from "@shared/ui/catalog-fk-combobox";
import { useCentrosAtencionList } from "@features/admin/modules/catalogos/centros-atencion/queries/useCentrosAtencionList";
import { useTiposAutorizacionList } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/useTiposAutorizacionList";

interface AutorizadorDetailsGeneralSectionProps {
  form: UseFormReturn<AutorizadorDetailsFormValues>;
  formId: string;
  autorizadorDetail: AutorizadorDetail;
  onSubmit: (values: AutorizadorDetailsFormValues) => void;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

export function AutorizadorDetailsGeneralSection({
  form,
  formId,
  autorizadorDetail,
  onSubmit,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: AutorizadorDetailsGeneralSectionProps) {
  const statusValue: CatalogStatus = autorizadorDetail.isActive
    ? CATALOG_STATUS.ACTIVE
    : CATALOG_STATUS.INACTIVE;

  const { data: centrosData } = useCentrosAtencionList({ isActive: true });
  const centrosOptions = (centrosData?.items ?? []).map((c) => ({ id: c.id, name: c.name }));

  const { data: tiposData } = useTiposAutorizacionList({ isActive: true });
  const tiposOptions = (tiposData?.items ?? []).map((t) => ({ id: t.id, name: t.name }));

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
                <FormLabel>Nombre del autorizador</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="centerId"
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
          <FormField
            control={form.control}
            name="authorizationTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de autorización</FormLabel>
                <FormControl>
                  <CatalogFkCombobox
                    options={tiposOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecciona un tipo"
                    searchPlaceholder="Buscar tipo..."
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
            <Label>Usuario asignado</Label>
            <Input value={autorizadorDetail.user?.name ?? "-"} disabled />
          </div>
          <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID de usuario</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={field.value === 0 ? "" : field.value}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === "" ? 0 : Number(event.target.value),
                      )
                    }
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
            name="authorizerPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña del autorizador</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Dejar en blanco para no cambiar"
                    {...field}
                    disabled={!isEditable}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fileNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>No. de expediente</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="signatureImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Imagen de firma (ruta)</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <Label>ID</Label>
            <Input value={autorizadorDetail.id.toString()} disabled />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
