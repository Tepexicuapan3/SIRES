import { useMutation } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UserImportResult } from "@api/types";

interface UserImportPreviewInput {
  file: File;
}

/**
 * PASO 1 - Preview de importacion masiva: valida el Excel sin persistir nada.
 */
export const useUserImportPreview = () => {
  return useMutation<UserImportResult, Error, UserImportPreviewInput>({
    mutationFn: ({ file }) => usersAPI.import.preview(file),
  });
};
