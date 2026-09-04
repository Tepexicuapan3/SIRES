export interface ClinicalHistory {
  id: number;
  noExp: string;
  pkNum: number;
  occupationId: number | null;
  educationLevelId: number | null;
  maritalStatusId: number | null;
  religionId: number | null;
  residenceTypeId: number | null;
  phone: string | null;
  familyHistory: string | null;
  currentIllness: string | null;
  systemsReview: string | null;
  headExam: string | null;
  neckExam: string | null;
  chestExam: string | null;
  abdomenExam: string | null;
  genitalsExam: string | null;
  limbsExam: string | null;
  diagnosticManagement: string | null;
  therapeuticManagement: string | null;
  allergies: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateClinicalHistoryRequest {
  occupationId?: number | null;
  educationLevelId?: number | null;
  maritalStatusId?: number | null;
  religionId?: number | null;
  residenceTypeId?: number | null;
  phone?: string | null;
  familyHistory?: string | null;
  currentIllness?: string | null;
  systemsReview?: string | null;
  headExam?: string | null;
  neckExam?: string | null;
  chestExam?: string | null;
  abdomenExam?: string | null;
  genitalsExam?: string | null;
  limbsExam?: string | null;
  diagnosticManagement?: string | null;
  therapeuticManagement?: string | null;
  allergies?: string | null;
}
