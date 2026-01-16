import { http, HttpResponse, delay } from "msw";
import { createMockClinica } from "../../factories/clinicas";
import { getApiUrl } from "../urls";

// Usamos matcher específico para evitar conflictos
export const clinicasHandlers = [
  // Listar clínicas (Catálogo)
  http.get(getApiUrl("clinicas"), async () => {
    await delay(300); // Latencia realista
    
    // Generar 10 clínicas de prueba
    const clinicas = Array.from({ length: 10 }).map(() => createMockClinica());
    
    // Asegurar que siempre haya una clínica conocida para tests e2e
    clinicas.unshift(createMockClinica({
        id_clin: 1,
        clinica: "CLÍNICA CENTRAL DE PRUEBA",
        folio_clin: "CEN"
    }));

    return HttpResponse.json({ clinicas });
  }),
];
