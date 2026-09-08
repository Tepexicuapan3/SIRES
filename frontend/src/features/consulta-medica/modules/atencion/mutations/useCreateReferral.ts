import { useMutation } from "@tanstack/react-query";
import { referralsAPI } from "@api/resources/referrals.api";
import type { CreateReferralRequest } from "@api/types";

interface CreateReferralInput {
  visitId: number;
  data: CreateReferralRequest;
}

export const useCreateReferral = () => {
  return useMutation({
    mutationFn: ({ visitId, data }: CreateReferralInput) =>
      referralsAPI.create(visitId, data),
  });
};
