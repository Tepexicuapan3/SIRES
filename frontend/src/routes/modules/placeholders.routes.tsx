import { useRoutes } from "react-router-dom";
import {
  farmaciaRoutes,
  recepcionRoutes,
  urgenciasRoutes,
} from "@/routes/modules/placeholders.routes.config";

export const RecepcionRoutes = () => useRoutes(recepcionRoutes);
export const FarmaciaRoutes = () => useRoutes(farmaciaRoutes);
export const UrgenciasRoutes = () => useRoutes(urgenciasRoutes);
