import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { useCreatePermission } from "@/domains/auth-access/hooks/rbac/permissions/useCreatePermission";
import {
  createPermissionSchema,
  type CreatePermissionFormValues,
} from "@/domains/auth-access/types/rbac/permissions.schemas";
import { getPermissionErrorMessage } from "@/domains/auth-access/adapters/rbac/permissions/permissions.feedback";

interface PermissionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreatePermissionFormValues = {
  code: "",
  name: "",
};

const FORM_ID = "permission-create-form";

export function PermissionCreateDialog({
  open,
  onOpenChange,
}: PermissionCreateDialogProps) {
  const createPermission = useCreatePermission();

  const form = useForm<CreatePermissionFormValues>({
    resolver: zodResolver(createPermissionSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(DEFAULT_VALUES);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: CreatePermissionFormValues) => {
    try {
      const result = await createPermission.mutateAsync({
        code: values.code.trim().toLowerCase(),
        name: values.name,
      });

      toast.success("Permiso creado", {
        description: `El permiso ${result.name} se creo correctamente.`,
      });
      handleDialogOpenChange(false);
    } catch (error) {
      toast.error("No se pudo crear el permiso", {
        description: getPermissionErrorMessage(error, "Error al crear permiso"),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo permiso</DialogTitle>
          <DialogDescription>
            Crea un codigo de permiso para que pueda asignarse a roles.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codigo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="modulo:submodulo:accion"
                      autoComplete="off"
                    />
                  </FormControl>
                  <p className="text-[11px] text-txt-muted">
                    Minusculas, sin espacios. Ej: servicios:contratos_oxigeno:read
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ver contratos de oxigeno" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDialogOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={createPermission.isPending}>
            Crear permiso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
