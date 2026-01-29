import { useRoutes } from "react-router-dom";
import { adminRoutes } from "@/routes/modules/admin.routes.config";

const AdminRoutes = () => useRoutes(adminRoutes);

export default AdminRoutes;
