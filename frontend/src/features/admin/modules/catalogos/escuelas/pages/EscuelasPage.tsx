import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function EscuelasPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.escuelas} />;
}

export default EscuelasPage;
