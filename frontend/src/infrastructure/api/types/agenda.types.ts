export interface AgendaSlot {
  id:                number;
  hora:              string;        // "HH:mm"
  duracionMin:       number;
  disponible:        boolean;
  consultorioId:     number | null;
  consultorioNumero: number | null;
  consultorioNombre: string | null;
  /** Canal habilitado para el slot: "PRESENCIAL" | "LINEA" | "AMBOS". */
  canal:             string;
  cita: {
    id:           number;
    folio:        string;
    noExp:        string;
    estatus:      string;
    servicioTipo: string;
    motivo:       string | null;
  } | null;
}

export interface AgendaSemanalResponse {
  medicoId:   number;
  fechaDesde: string;
  fechaHasta: string;
  agenda:     Record<string, AgendaSlot[]>;  // clave: "YYYY-MM-DD"
}
