export interface MedicalLeaveItem {
  id: number;
  visitId: number;
  folio: string;
  leaveTypeId: number;
  leaveTypeName: string;
  isSubsequent: boolean;
  days: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface PatientMedicalLeavesResponse {
  items: MedicalLeaveItem[];
  total: number;
}

export interface CreateMedicalLeaveRequest {
  leaveTypeId: number;
  days: number;
  startDate: string;
  isSubsequent?: boolean;
}
