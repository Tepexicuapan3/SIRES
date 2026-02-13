import type { UseFormReturn } from "react-hook-form";
import { ShieldCheck, UserRound } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CentroAtencionListItem, UserDetail } from "@api/types";
import type { UserDetailsFormValues } from "@features/admin/modules/rbac/users/domain/users.schemas";

interface UserDetailsGeneralTabProps {
  form: UseFormReturn<UserDetailsFormValues>;
  formId: string;
  clinicOptions: CentroAtencionListItem[];
  userDetail: UserDetail;
  accountIsActive: boolean;
  onSubmit: (values: UserDetailsFormValues) => void;
  onAccountStatusChange: (nextActive: boolean) => void;
  isEditable?: boolean;
}

const ACCOUNT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type AccountStatusValue = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

export function UserDetailsGeneralTab({
  form,
  formId,
  clinicOptions,
  userDetail,
  accountIsActive,
  onSubmit,
  onAccountStatusChange,
  isEditable = true,
}: UserDetailsGeneralTabProps) {
  const accountStatusValue: AccountStatusValue = accountIsActive
    ? ACCOUNT_STATUS.ACTIVE
    : ACCOUNT_STATUS.INACTIVE;

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <div className="mx-auto w-full max-w-[480px]">
          <div className="relative h-11 rounded-2xl bg-subtle/20 ring-1 ring-line-struct/70">
            <div className="flex h-full items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2 px-4 text-sm text-txt-body">
                <UserRound className="size-4 shrink-0 text-txt-muted" />
                <span className="truncate" title={userDetail.username}>
                  {userDetail.username}
                </span>
              </div>
              <div className="flex min-w-0 shrink-0 items-center gap-1.5 border-l border-line-struct/70 pl-2 pr-4 text-sm text-txt-body">
                <ShieldCheck className="size-4 shrink-0 text-txt-muted" />
                <span
                  className="truncate"
                  title={userDetail.primaryRole || "Sin rol"}
                >
                  {userDetail.primaryRole || "Sin rol"}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                    <SelectTrigger className="h-11">
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
          <div className="space-y-2">
            <p
              id="user-account-status-label"
              className="text-xs font-semibold tracking-wide text-txt-muted uppercase"
            >
              Estado de la cuenta
            </p>
            <Select
              value={accountStatusValue}
              onValueChange={(value) =>
                onAccountStatusChange(value === ACCOUNT_STATUS.ACTIVE)
              }
              disabled={!isEditable}
            >
              <FormControl>
                <SelectTrigger
                  className="h-11"
                  aria-labelledby="user-account-status-label"
                >
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={ACCOUNT_STATUS.ACTIVE}>Activo</SelectItem>
                <SelectItem value={ACCOUNT_STATUS.INACTIVE}>
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
