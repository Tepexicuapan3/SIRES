export const CATALOG_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type CatalogStatus =
  (typeof CATALOG_STATUS)[keyof typeof CATALOG_STATUS];
