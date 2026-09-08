export type SecondaryDiagnosisStatus = "activo" | "cancelado";

export interface SecondaryDiagnosisItem {
  id: number;
  visitId: number;
  cieCode: string;
  cieDescription: string;
  notes: string | null;
  status: SecondaryDiagnosisStatus;
  createdAt: string;
}

export interface VisitSecondaryDiagnosesResponse {
  items: SecondaryDiagnosisItem[];
  total: number;
}

export interface AddSecondaryDiagnosisRequest {
  cieCode: string;
  notes?: string;
}
