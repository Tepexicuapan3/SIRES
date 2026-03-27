import {
  Calendar,
  ClipboardList,
  FileText,
  Plus,
  Stethoscope,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { useAuthSession } from "@features/auth/queries/useAuthSession";

const HUB_ACTIONS = [
  {
    title: "Nueva consulta",
    description: "Iniciar atencion clinica de forma inmediata.",
    icon: Plus,
    to: "/clinico/consultas/nueva",
  },
  {
    title: "Agenda",
    description: "Revisar citas programadas y estado de atencion.",
    icon: Calendar,
    to: "/clinico/consultas/agenda",
  },
  {
    title: "Historial",
    description: "Consultar evolucion clinica por paciente.",
    icon: ClipboardList,
    to: "/clinico/consultas/historial",
  },
  {
    title: "Expedientes",
    description: "Abrir expedientes y datos administrativos.",
    icon: FileText,
    to: "/clinico/expedientes",
  },
] as const;

export const ConsultasPage = () => {
  const { data: user } = useAuthSession();

  return (
    <div className="min-h-screen bg-app p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-xl border border-line-struct bg-paper p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand/10 p-2">
              <Stethoscope className="size-6 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-txt-body">
                Consultas
              </h1>
              <p className="text-sm text-txt-muted">
                {user?.fullName
                  ? `Equipo de ${user.fullName}`
                  : "Navegacion clinica"}
              </p>
            </div>
          </div>
        </header>

        <section>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {HUB_ACTIONS.map((action) => (
              <Link key={action.to} to={action.to}>
                <Card className="h-full border-line-struct transition-colors hover:border-brand/40">
                  <CardHeader>
                    <div className="mb-3 inline-flex rounded-lg bg-subtle p-2">
                      <action.icon className="size-5 text-brand" />
                    </div>
                    <CardTitle>{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/clinico/consultas/nueva">Iniciar consulta</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/clinico/consultas/agenda">Abrir agenda</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/clinico/consultas/historial">Ver historial</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ConsultasPage;
