import { useRoutes } from "react-router-dom";
import { adminRoutes } from "@/routes/modules/admin.routes.config";

export const AdminRoutes = () => useRoutes(adminRoutes);
