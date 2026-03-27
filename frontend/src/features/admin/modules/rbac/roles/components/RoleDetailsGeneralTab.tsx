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
import { Textarea } from "@shared/ui/textarea";
import type { RoleDetail } from "@api/types";
import type { RoleDetailsFormValues } from "@features/admin/modules/rbac/roles/domain/roles.schemas";

interface RoleDetailsGeneralTabProps {
  form: UseFormReturn<RoleDetailsFormValues>;
  formId: string;
  roleDetail: RoleDetail;
  onSubmit: (values: RoleDetailsFormValues) => void;
  activeStatus: boolean;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

const STATUS_OPTIONS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusOption = (typeof STATUS_OPTIONS)[keyof typeof STATUS_OPTIONS];

export function RoleDetailsGeneralTab({
  form,
  formId,
  roleDetail,
  onSubmit,
  activeStatus,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: RoleDetailsGeneralTabProps) {
  const statusValue: StatusOption = activeStatus
    ? STATUS_OPTIONS.ACTIVE
    : STATUS_OPTIONS.INACTIVE;

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
                <FormLabel>Nombre del rol</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="landingRoute"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Landing route</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="/admin/roles"
                    disabled={!isEditable}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} disabled={!isEditable} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Input
              value={roleDetail.isSystem ? "Sistema" : "Custom"}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={statusValue}
              onValueChange={(value) => {
                if (!onStatusChange || !isEditable) return;
                if (value === statusValue) return;
                onStatusChange(value === STATUS_OPTIONS.ACTIVE);
              }}
              disabled={!onStatusChange || isStatusPending || !isEditable}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={STATUS_OPTIONS.ACTIVE}>Activo</SelectItem>
                <SelectItem value={STATUS_OPTIONS.INACTIVE}>
                  Inactivo
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>
    </Form>
  );
}
