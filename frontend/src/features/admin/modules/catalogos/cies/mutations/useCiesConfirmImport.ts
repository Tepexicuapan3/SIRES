import { useMutation } from "@tanstack/react-query";
import { ciesAPI, type CiesUploadRow } from "@api/resources/catalogos/cies.api";

export const useCiesConfirmImport = () => {
  return useMutation({
    mutationFn: (rows: CiesUploadRow[]) => ciesAPI.confirm(rows),
  });
};
