import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UserImportResult } from "@api/types";
import { usersKeys } from "@/domains/auth-access/hooks/rbac/users/users.keys";

interface UserImportConfirmInput {
  file: File;
}

/**
 * PASO 2 - Confirm de importacion masiva: crea usuarios solo si el archivo
 * no tiene ningun error (todo-o-nada). Invalida el listado de usuarios
 * cuando la importacion efectivamente inserta registros.
 */
export const useUserImportConfirm = () => {
  const queryClient = useQueryClient();

  return useMutation<UserImportResult, Error, UserImportConfirmInput>({
    mutationFn: ({ file }) => usersAPI.import.confirm(file),
    onSuccess: (result) => {
      if (result.inserted > 0) {
        void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
      }
    },
  });
};
