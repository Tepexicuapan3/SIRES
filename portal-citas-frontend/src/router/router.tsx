import { createBrowserRouter } from "react-router-dom";

import ProtectedRoute from "@/router/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import ConfirmarReservaPage from "@/pages/ConfirmarReservaPage";
import ReservaExitosaPage from "@/pages/ReservaExitosaPage";
import MisCitasPage from "@/pages/MisCitasPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        // Resumen del draft + POST /portal/citas (Fase F3).
        path: "/reservar/confirmar",
        element: <ConfirmarReservaPage />,
      },
      {
        // Comprobante (folio, fecha/hora, consultorio, médico) tras una
        // reserva exitosa (Fase F3).
        path: "/reservar/exito",
        element: <ReservaExitosaPage />,
      },
      {
        // Listado de citas del núcleo + cancelación (Fase F4).
        path: "/mis-citas",
        element: <MisCitasPage />,
      },
    ],
  },
]);
