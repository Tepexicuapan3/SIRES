import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function TiposCitasPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.tiposCitas} />;
}

export default TiposCitasPage;
