import { useMutation } from "@tanstack/react-query";
import {
  catalogImportAPI,
  type CatalogImportResponse,
} from "@api/resources/catalogos/catalog-import.api";

interface CatalogImportPreviewInput {
  slug: string;
  file: File;
}

export const useCatalogImportPreview = () => {
  return useMutation<CatalogImportResponse, Error, CatalogImportPreviewInput>({
    mutationFn: ({ slug, file }) => catalogImportAPI.preview(slug, file),
  });
};
