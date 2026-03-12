import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function PasesPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.pases} />;
}

export default PasesPage;
