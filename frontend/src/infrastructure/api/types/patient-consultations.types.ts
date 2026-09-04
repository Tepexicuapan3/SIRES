export interface PatientConsultationHistoryItem {
  visitId: number;
  date: string | null;
  doctorId: number | null;
  doctorName: string | null;
  serviceType: string;
  primaryDiagnosis: string;
  cieCode: string | null;
  cieDescription: string | null;
  finalNote: string;
  prescriptionItems: string[];
}

export interface PatientConsultationsHistoryResponse {
  items: PatientConsultationHistoryItem[];
  total: number;
}
