export interface StomatologyHistory {
  id: number;
  noExp: string;
  pkNum: number;
  familyDiabetes: boolean;
  familyCancer: boolean;
  familyHighBloodPressure: boolean;
  familyLowBloodPressure: boolean;
  causeOfDeath: string | null;
  personalDiabetes: boolean;
  personalAsthma: boolean;
  personalHighBloodPressure: boolean;
  personalLowBloodPressure: boolean;
  personalHepatitis: boolean;
  personalHiv: boolean;
  personalSmoking: boolean;
  personalAlcoholism: boolean;
  personalSubstanceAbuse: boolean;
  habits: string | null;
  diet: string | null;
  surgicalHistory: string | null;
  traumaticHistory: string | null;
  allergyMedications: string | null;
  allergyDentalMaterial: string | null;
  allergyAnesthesia: string | null;
  allergyFood: string | null;
  allergyEnvironment: string | null;
  allergyOther: string | null;
  currentIllnessHistory: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export type UpdateStomatologyHistoryRequest = Partial<
  Omit<StomatologyHistory, "id" | "noExp" | "pkNum" | "isActive" | "createdAt" | "updatedAt">
>;
