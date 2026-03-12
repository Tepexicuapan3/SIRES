import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function EnfermedadesPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.enfermedades} />;
}

export default EnfermedadesPage;
