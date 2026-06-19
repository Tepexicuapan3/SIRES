import { useState } from "react";
import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";
import { SucursalCreateDialog } from "@features/admin/modules/catalogos/sucursales/components/SucursalCreateDialog";

export function SucursalesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <GenericCatalogPage
      catalog={catalogDefinitions.sucursales}
      createAction={{
        label: "Nuevo",
        permission: "admin:catalogos:sucursales:create",
        onClick: () => setCreateOpen(true),
      }}
    >
      <SucursalCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </GenericCatalogPage>
  );
}

export default SucursalesPage;
