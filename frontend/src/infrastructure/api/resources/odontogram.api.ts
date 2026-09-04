import apiClient from "@api/client";
import type {
  OdontogramDentition,
  PatientOdontogramResponse,
  OdontogramToothItem,
  UpdateOdontogramToothRequest,
} from "@api/types/odontogram.types";

export const odontogramAPI = {
  get: async (
    noExp: string,
    pkNum = 0,
    dentition: OdontogramDentition = "permanent",
  ): Promise<PatientOdontogramResponse> => {
    const response = await apiClient.get<PatientOdontogramResponse>(
      `/patients/${noExp}/odontogram`,
      { params: { pkNum, dentition } },
    );
    return response.data;
  },

  updateTooth: async (
    noExp: string,
    pkNum: number,
    toothFdi: string,
    data: UpdateOdontogramToothRequest,
  ): Promise<OdontogramToothItem> => {
    const response = await apiClient.patch<OdontogramToothItem>(
      `/patients/${noExp}/odontogram/${toothFdi}`,
      data,
      { params: { pkNum } },
    );
    return response.data;
  },
};
