import { useRef, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { Loader2, Search, ShieldCheck, UserRound } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Separator } from "@shared/ui/separator";
import type { CentroAtencionListItem, UserDetail } from "@api/types";
import type { UserDetailsFormValues } from "@/domains/auth-access/types/rbac/users.schemas";
import { ClinicCombobox } from "@/domains/auth-access/components/admin/rbac/users/ClinicCombobox";
import { AreaClinicaCombobox } from "@/domains/auth-access/components/admin/rbac/users/AreaClinicaCombobox";
import { CedulasSection } from "@/domains/auth-access/components/admin/rbac/users/CedulasSection";
import { useEmpleadoSermedLookup } from "@/domains/auth-access/hooks/rbac/users/useEmpleadoSermedLookup";

interface AreaClinicaOption {
  id: number;
  name: string;
}

interface UserDetailsGeneralTabProps {
  form: UseFormReturn<UserDetailsFormValues>;
  formId: string;
  clinicOptions: CentroAtencionListItem[];
  areaClinicaOptions?: AreaClinicaOption[];
  isClinicsCatalogLoading?: boolean;
  userDetail: UserDetail;
  accountIsActive: boolean;
  onSubmit: (values: UserDetailsFormValues) => void;
  onAccountStatusChange: (nextActive: boolean) => void;
  isEditable?: boolean;
  canChangeAccountStatus?: boolean;
}

const ACCOUNT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

type AccountStatusValue = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

interface ClinicSelectOption {
  id: number;
  name: string;
}

export function UserDetailsGeneralTab({
  form,
  formId,
  clinicOptions,
  areaClinicaOptions = [],
  isClinicsCatalogLoading = false,
  userDetail,
  accountIsActive,
  onSubmit,
  onAccountStatusChange,
  isEditable = true,
  canChangeAccountStatus = true,
}: UserDetailsGeneralTabProps) {
  const accountStatusValue: AccountStatusValue = accountIsActive
    ? ACCOUNT_STATUS.ACTIVE
    : ACCOUNT_STATUS.INACTIVE;

  const clinicSelectOptions: ClinicSelectOption[] = clinicOptions.map(
    (clinic) => ({
      id: clinic.id,
      name: clinic.name,
    }),
  );
  const currentClinic = userDetail.clinic;
  if (
    currentClinic &&
    !clinicSelectOptions.some((clinic) => clinic.id === currentClinic.id)
  ) {
    clinicSelectOptions.unshift({
      id: currentClinic.id,
      name: currentClinic.name,
    });
  }

  const currentArea = userDetail.areaClinica;
  const areaOptions = [...areaClinicaOptions];
  if (currentArea && !areaOptions.some((a) => a.id === currentArea.id)) {
    areaOptions.unshift({ id: currentArea.id, name: currentArea.name });
  }

  const { lookup, isLoading: isLookingUp, result: lookupResult, error: lookupError } =
    useEmpleadoSermedLookup();
  const noExpInputRef = useRef<HTMLInputElement>(null);
  const [lookupAttempted, setLookupAttempted] = useState(false);

  const handleNoExpLookup = async () => {
    const noExp = form.getValues("noExp")?.trim();
    if (!noExp) return;
    setLookupAttempted(true);
    const found = await lookup(noExp);
    if (found?.cdLaboral) {
      form.setValue("cdLaboral", found.cdLaboral);
    }
  };

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Usuario + Rol (solo lectura) */}
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

        {/* Datos personales */}
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

        {/* Centro de atención + Estado */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="clinicId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Centro de atencion</FormLabel>
                {isClinicsCatalogLoading ? (
                  <FormControl>
                    <Input
                      value={userDetail.clinic?.name ?? "Sin centro"}
                      disabled
                    />
                  </FormControl>
                ) : (
                  <FormControl>
                    <ClinicCombobox
                      value={field.value ?? null}
                      onChange={field.onChange}
                      options={clinicSelectOptions}
                      disabled={!isEditable}
                    />
                  </FormControl>
                )}
                {isClinicsCatalogLoading ? (
                  <p className="text-xs text-txt-muted">
                    Cargando catalogo de centros...
                  </p>
                ) : null}
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
              disabled={!canChangeAccountStatus}
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
            {!canChangeAccountStatus && isEditable ? (
              <p className="text-xs text-txt-muted">
                No puedes desactivar tu propia cuenta.
              </p>
            ) : null}
          </div>
        </div>

        <Separator />

        {/* Datos SERMED */}
        <div className="space-y-4">
          <p className="text-xs font-semibold tracking-wide text-txt-muted uppercase">
            Datos SERMED
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* cd_laboral (solo lectura, se llena desde búsqueda SERMED) */}
            <FormField
              control={form.control}
              name="cdLaboral"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Clave laboral SERMED</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                      placeholder="Se llena al buscar expediente"
                      disabled={!isEditable}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Número de expediente con búsqueda */}
            <FormField
              control={form.control}
              name="noExp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. expediente SERMED</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        ref={noExpInputRef}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        placeholder="Ej. 123456"
                        disabled={!isEditable}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleNoExpLookup();
                          }
                        }}
                      />
                    </FormControl>
                    {isEditable ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        disabled={isLookingUp || !form.getValues("noExp")}
                        onClick={() => void handleNoExpLookup()}
                      >
                        {isLookingUp ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Search className="size-4" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                  {lookupAttempted && lookupResult ? (
                    <p className="text-xs text-status-stable">
                      {[lookupResult.firstName, lookupResult.paternalName, lookupResult.maternalName]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  ) : null}
                  {lookupAttempted && lookupError ? (
                    <p className="text-xs text-status-critical">{lookupError}</p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Área clínica */}
            <FormField
              control={form.control}
              name="areaClinicaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área clínica</FormLabel>
                  <FormControl>
                    <AreaClinicaCombobox
                      value={field.value ?? null}
                      onChange={field.onChange}
                      options={areaOptions}
                      disabled={!isEditable}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Cédulas profesionales */}
        <CedulasSection form={form} isEditable={isEditable} />
      </form>
    </Form>
  );
}
