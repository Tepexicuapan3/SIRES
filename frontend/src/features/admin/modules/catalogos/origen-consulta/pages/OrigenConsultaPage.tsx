import { GenericCatalogPage } from "@features/admin/modules/catalogos/shared/pages/GenericCatalogPage";
import { catalogDefinitions } from "@features/admin/modules/catalogos/shared/domain/catalog-definitions";

export function OrigenConsultaPage() {
  return <GenericCatalogPage catalog={catalogDefinitions.origenConsulta} />;
}

export default OrigenConsultaPage;
