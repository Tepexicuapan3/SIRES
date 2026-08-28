import { useRoutes } from "react-router-dom";
import { comunicadosRoutes } from "@routes/modules/comunicados.routes.config";

const ComunicadosRoutes = () => useRoutes(comunicadosRoutes);

export default ComunicadosRoutes;
