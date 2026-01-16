import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Configuramos el servidor de intercepción de peticiones con nuestros handlers
// Este servidor capturará las llamadas de axios/fetch durante los tests
export const server = setupServer(...handlers);
