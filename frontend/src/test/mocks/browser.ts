import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Configura el Service Worker con los mismos handlers que usamos en los tests
export const worker = setupWorker(...handlers);
