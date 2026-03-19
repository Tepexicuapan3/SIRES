import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function GruposMedicamentosPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.gruposMedicamentos} />;
}

export default GruposMedicamentosPage;
