export interface CatalogDefinition {
  slug: string;
  title: string;
  description: string;
  endpoint: string;
  permissionRead: string;
  hasCodeColumn?: boolean;
}

// Vacio: todos los catalogos que usaban GenericCatalogPage migraron a su
// propia pagina con CRUD completo. Se conserva el tipo por si un catalogo
// futuro arranca en modo solo-lectura antes de tener su CRUD propio.
export const catalogDefinitions = {} as const satisfies Record<
  string,
  CatalogDefinition
>;
