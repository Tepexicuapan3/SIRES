import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function CalidadLaboralPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.calidadLaboral} />;
}

export default CalidadLaboralPage;
