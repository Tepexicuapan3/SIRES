import { useRoutes } from "react-router-dom";
import { serviciosRoutes } from "@routes/modules/servicios.routes.config";

const ServiciosRoutes = () => useRoutes(serviciosRoutes);

export default ServiciosRoutes;
