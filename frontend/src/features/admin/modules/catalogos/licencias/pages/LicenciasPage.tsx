import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function LicenciasPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.licencias} />;
}

export default LicenciasPage;
