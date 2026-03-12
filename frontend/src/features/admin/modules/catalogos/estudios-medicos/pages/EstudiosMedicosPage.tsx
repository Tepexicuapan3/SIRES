import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function EstudiosMedicosPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.estudiosMedicos} />;
}

export default EstudiosMedicosPage;
