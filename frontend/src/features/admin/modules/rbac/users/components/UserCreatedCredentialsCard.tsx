import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CreateUserResponse } from "@api/types";

interface UserCreatedCredentialsCardProps {
  createdCredentials: CreateUserResponse;
  onCopyCredentials: () => void;
}

export function UserCreatedCredentialsCard({
  createdCredentials,
  onCopyCredentials,
}: UserCreatedCredentialsCardProps) {
  return (
    <div className="rounded-2xl border border-line-struct bg-subtle/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-txt-body">Acceso generado</p>
          <p className="text-xs text-txt-muted">
            Guarda la clave temporal. Solo se muestra una vez.
          </p>
        </div>
        <Badge variant="stable">Temporal</Badge>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
          <p className="text-xs text-txt-muted">Usuario</p>
          <p className="text-sm font-medium text-txt-body">
            {createdCredentials.username}
          </p>
        </div>
        <div className="rounded-xl border border-line-struct/60 bg-paper px-3 py-2">
          <p className="text-xs text-txt-muted">Clave temporal</p>
          <p className="text-sm font-medium text-txt-body">
            {createdCredentials.temporaryPassword}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onCopyCredentials}>
          <Copy className="size-4" />
          Copiar credenciales
        </Button>
      </div>
    </div>
  );
}
