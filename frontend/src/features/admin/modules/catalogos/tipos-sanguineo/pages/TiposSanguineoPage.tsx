import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function TiposSanguineoPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.tiposSanguineo} />;
}

export default TiposSanguineoPage;
