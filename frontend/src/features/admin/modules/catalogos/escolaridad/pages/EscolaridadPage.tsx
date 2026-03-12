import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function EscolaridadPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.escolaridad} />;
}

export default EscolaridadPage;
