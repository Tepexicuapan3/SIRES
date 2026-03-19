import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function ParentescosPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.parentescos} />;
}

export default ParentescosPage;
