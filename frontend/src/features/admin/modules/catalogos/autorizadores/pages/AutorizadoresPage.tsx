import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function AutorizadoresPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.autorizadores} />;
}

export default AutorizadoresPage;
