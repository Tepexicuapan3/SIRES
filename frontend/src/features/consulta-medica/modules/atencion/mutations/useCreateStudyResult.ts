import { useMutation } from "@tanstack/react-query";
import { studyResultAPI } from "@api/resources/study-result.api";
import type { CreateStudyResultRequest } from "@api/types";

interface CreateStudyResultInput {
  visitId: number;
  data: CreateStudyResultRequest;
}

export const useCreateStudyResult = () => {
  return useMutation({
    mutationFn: ({ visitId, data }: CreateStudyResultInput) =>
      studyResultAPI.create(visitId, data),
  });
};
