import apiClient from "@api/client";
import type {
  CancelReferralRequest,
  CreateReferralRequest,
  PatientReferralsResponse,
  ReferralItem,
} from "@api/types/referral.types";

export const referralsAPI = {
  getPatientHistory: async (
    noExp: string,
    pkNum = 0,
  ): Promise<PatientReferralsResponse> => {
    const response = await apiClient.get<PatientReferralsResponse>(
      `/patients/${noExp}/referrals`,
      { params: { pkNum } },
    );
    return response.data;
  },

  create: async (
    visitId: number,
    data: CreateReferralRequest,
  ): Promise<ReferralItem> => {
    const response = await apiClient.post<ReferralItem>(
      `/visits/${visitId}/referrals`,
      data,
    );
    return response.data;
  },

  cancel: async (
    referralId: number,
    data: CancelReferralRequest,
  ): Promise<ReferralItem> => {
    const response = await apiClient.patch<ReferralItem>(
      `/referrals/${referralId}/cancel`,
      data,
    );
    return response.data;
  },
};
