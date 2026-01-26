import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/main.css";
import App from "@/App";

/**
 * Inicializa MSW en desarrollo cuando esta habilitado por env.
 *
 * Razon industria:
 * - Mantiene el bootstrap identico entre entornos.
 * - Permite aislar backend en QA sin tocar el bundle de produccion.
 */
async function enableMocking() {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW === "true") {
    const { worker } = await import("@/test/mocks/browser");
    // onUnhandledRequest: "bypass" evita bloquear assets no mockeados.
    return worker.start({ onUnhandledRequest: "bypass" });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {/* StrictMode ayuda a detectar efectos secundarios en desarrollo. */}
      <App />
    </StrictMode>,
  );
});
