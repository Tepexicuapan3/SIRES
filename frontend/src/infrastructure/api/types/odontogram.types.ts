export type ToothCondition =
  | "healthy"
  | "caries"
  | "filled"
  | "crown"
  | "missing"
  | "extraction_needed"
  | "root_canal"
  | "sealant"
  | "fracture"
  | "implant";

export interface OdontogramToothItem {
  toothFdi: string;
  condition: ToothCondition;
  notes: string | null;
  updatedAt: string | null;
}

export interface PatientOdontogramResponse {
  items: OdontogramToothItem[];
}

export interface UpdateOdontogramToothRequest {
  condition: ToothCondition;
  notes?: string | null;
}

export type OdontogramDentition = "permanent" | "deciduous";
