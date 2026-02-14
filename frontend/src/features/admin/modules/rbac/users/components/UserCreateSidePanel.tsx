import { ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Separator } from "@/components/ui/separator";

export function UserCreateSidePanel() {
  return (
    <aside className="hidden w-[310px] shrink-0 border-r border-line-struct/70 bg-subtle/20 lg:flex">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <div className="flex flex-col items-center space-y-4 px-6 pt-6 pb-5 text-center">
          <Avatar className="size-20 rounded-2xl border border-line-struct/70 bg-subtle/40">
            <AvatarFallback className="rounded-2xl text-sm font-semibold text-txt-muted">
              NU
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-base leading-none font-semibold text-txt-body uppercase">
              Nuevo usuario
            </p>
            <p className="text-sm text-txt-muted">
              Completa los datos para generar acceso al sistema.
            </p>
          </div>
          <Badge variant="outline">Plantilla</Badge>
        </div>

        <Separator />

        <ScrollArea className="min-h-0 flex-1 px-6 py-5">
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-2.5 rounded-xl border border-line-struct/60 bg-paper/60 px-3 py-3">
              <UserRound className="mt-0.5 size-4 shrink-0 text-txt-muted" />
              <div>
                <p className="font-medium text-txt-body">Perfil base</p>
                <p className="text-xs text-txt-muted">
                  Define nombre, usuario y correo institucional.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-line-struct/60 bg-paper/60 px-3 py-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-txt-muted" />
              <div>
                <p className="font-medium text-txt-body">Accesos</p>
                <p className="text-xs text-txt-muted">
                  Asigna centro y rol primario para permisos iniciales.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
