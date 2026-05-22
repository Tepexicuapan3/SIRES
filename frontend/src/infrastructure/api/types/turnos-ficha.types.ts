export interface TurnoFichaConfig {
  id:         number;
  nombre:     string;
  horaInicio: string;  // HH:mm
  horaFin:    string;  // HH:mm
  maxFichas:  number;
  isActive:   boolean;
}

export interface TurnoActualResponse {
  turno:        TurnoFichaConfig | null;
  fichasUsadas: number;
  maxFichas:    number;
  disponibles:  number;
}

export interface UpdateTurnoFichaRequest {
  nombre?:     string;
  horaInicio?: string;
  horaFin?:    string;
  maxFichas?:  number;
  isActive?:   boolean;
}

export interface CreateTurnoFichaRequest {
  nombre:     string;
  horaInicio: string;
  horaFin:    string;
  maxFichas:  number;
  isActive?:  boolean;
}
