import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function EspecialidadesPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.especialidades} />;
}

export default EspecialidadesPage;
