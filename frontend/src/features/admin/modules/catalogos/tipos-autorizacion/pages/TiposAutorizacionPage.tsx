import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function TiposAutorizacionPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.tiposAutorizacion} />;
}

export default TiposAutorizacionPage;
