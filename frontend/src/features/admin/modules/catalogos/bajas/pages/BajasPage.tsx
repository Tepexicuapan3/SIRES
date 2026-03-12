import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function BajasPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.bajas} />;
}

export default BajasPage;
