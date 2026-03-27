import { useMutation } from "@tanstack/react-query";
import {
  ciesAPI,
  type CiesPreviewResponse,
} from "@api/resources/catalogos/cies.api";

interface CiesPreviewInput {
  file: File;
  version: string;
}

export const useCiesPreview = () => {
  return useMutation<CiesPreviewResponse, Error, CiesPreviewInput>({
    mutationFn: ({ file, version }) => ciesAPI.preview(file, version),
  });
};
