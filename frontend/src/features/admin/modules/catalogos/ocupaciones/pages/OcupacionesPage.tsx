import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function OcupacionesPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.ocupaciones} />;
}

export default OcupacionesPage;
