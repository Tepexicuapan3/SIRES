export interface StudyResultItem {
  id: number;
  visitId: number;
  studyTypeId: number;
  studyTypeName: string;
  resultDate: string;
  notes: string | null;
  fileUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PatientStudyResultsResponse {
  items: StudyResultItem[];
  total: number;
}

export interface CreateStudyResultRequest {
  studyTypeId: number;
  resultDate: string;
  notes?: string;
  file: File;
}
