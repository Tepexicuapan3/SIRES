import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function TurnosPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.turnos} />;
}

export default TurnosPage;
