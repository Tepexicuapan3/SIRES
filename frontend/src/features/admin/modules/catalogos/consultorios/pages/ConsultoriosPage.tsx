import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function ConsultoriosPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.consultorios} />;
}

export default ConsultoriosPage;
