import { useMutation } from "@tanstack/react-query";
import {
  catalogImportAPI,
  type CatalogImportResponse,
} from "@api/resources/catalogos/catalog-import.api";

interface CatalogImportConfirmInput {
  slug: string;
  file: File;
}

export const useCatalogImportConfirm = () => {
  return useMutation<CatalogImportResponse, Error, CatalogImportConfirmInput>({
    mutationFn: ({ slug, file }) => catalogImportAPI.confirm(slug, file),
  });
};
