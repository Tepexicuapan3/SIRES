import type { UseFormReturn } from "react-hook-form";
import { CalendarDays } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { CentroAtencionListItem, UserDetail } from "@api/types";
import type { UserDetailsFormValues } from "@features/admin/modules/rbac/users/domain/users.schemas";

interface UserDetailsGeneralTabProps {
  form: UseFormReturn<UserDetailsFormValues>;
  formId: string;
  clinicOptions: CentroAtencionListItem[];
  userDetail: UserDetail;
  onSubmit: (values: UserDetailsFormValues) => void;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  lastLoginLabel: string;
  lastIpLabel: string;
  isEditable?: boolean;
}

const STATUS_OPTIONS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type StatusOption = (typeof STATUS_OPTIONS)[keyof typeof STATUS_OPTIONS];

export function UserDetailsGeneralTab({
  form,
  formId,
  clinicOptions,
  userDetail,
  onSubmit,
  onStatusChange,
  isStatusPending = false,
  lastLoginLabel,
  lastIpLabel,
  isEditable = true,
}: UserDetailsGeneralTabProps) {
  const statusValue: StatusOption = userDetail.isActive
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
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="paternalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido paterno</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maternalName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido materno</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input type="email" {...field} disabled={!isEditable} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Usuario</Label>
            <Input value={userDetail.username} disabled />
          </div>
          <FormField
            control={form.control}
            name="clinicId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de atencion</FormLabel>
                <Select
                  value={field.value ? field.value.toString() : "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : Number(value))
                  }
                  disabled={!isEditable}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un centro" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Sin centro</SelectItem>
                    {clinicOptions.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id.toString()}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Rol principal</Label>
            <Input value={userDetail.primaryRole || "Sin rol"} disabled />
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

        <Separator />

        <div className="grid gap-2 text-xs text-txt-muted sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4" />
            <span>Ultimo acceso: {lastLoginLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Ultima IP: {lastIpLabel}</span>
          </div>
        </div>
      </form>
    </Form>
  );
}
