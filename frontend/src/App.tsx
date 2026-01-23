import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/Routes";
import { AppProviders } from "@/providers/AppProviders";

/**
 * Raiz de la aplicacion.
 *
 * Razon industria:
 * - Centraliza providers transversales (query, theme, toasts).
 * - RouterProvider vive aqui para evitar acoplarlo al entrypoint.
 */
function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
