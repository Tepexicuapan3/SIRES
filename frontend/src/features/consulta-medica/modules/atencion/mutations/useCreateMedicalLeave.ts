import { useMutation } from "@tanstack/react-query";
import { medicalLeaveAPI } from "@api/resources/medical-leave.api";
import type { CreateMedicalLeaveRequest } from "@api/types";

interface CreateMedicalLeaveInput {
  visitId: number;
  data: CreateMedicalLeaveRequest;
}

export const useCreateMedicalLeave = () => {
  return useMutation({
    mutationFn: ({ visitId, data }: CreateMedicalLeaveInput) =>
      medicalLeaveAPI.create(visitId, data),
  });
};
