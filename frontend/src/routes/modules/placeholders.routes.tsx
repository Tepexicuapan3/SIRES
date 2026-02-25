import { useRoutes } from "react-router-dom";
import {
  farmaciaRoutes,
  urgenciasRoutes,
} from "@/routes/modules/placeholders.routes.config";

export const FarmaciaRoutes = () => useRoutes(farmaciaRoutes);
export const UrgenciasRoutes = () => useRoutes(urgenciasRoutes);
