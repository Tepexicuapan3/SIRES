import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contratosAPI } from "@api/resources/contratos.api";
import type { CreateContratoRequest, UpdateContratoRequest } from "@api/types";
import { CONTRATOS_KEYS } from "../queries/useContratosList";

const useInvalidate = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: CONTRATOS_KEYS.all });
  };
};

export const useCreateContrato = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (data: CreateContratoRequest) => contratosAPI.create(data),
    onSuccess:  invalidate,
  });
};

export const useUpdateContrato = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContratoRequest }) =>
      contratosAPI.update(id, data),
    onSuccess: invalidate,
  });
};
