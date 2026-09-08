export type PrescriptionItemStatus = "activo" | "cancelado";

export interface PrescriptionItem {
  id: number;
  visitId: number;
  medicationId: number;
  medicationName: string;
  genericName: string | null;
  presentation: string | null;
  dose: string | null;
  indications: string;
  quantity: number;
  status: PrescriptionItemStatus;
  createdAt: string;
}

export interface VisitPrescriptionItemsResponse {
  items: PrescriptionItem[];
  total: number;
}

export interface AddPrescriptionItemRequest {
  medicationId: number;
  quantity: number;
  indications: string;
  dose?: string;
}
