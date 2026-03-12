import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function TiposAreasPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.tiposAreas} />;
}

export default TiposAreasPage;
