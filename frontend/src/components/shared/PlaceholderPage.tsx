import { Construction, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  moduleName: string;
}

export default function PlaceholderPage({
  title,
  description,
  moduleName,
}: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-bg-app p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-status-alert/10 p-6">
            <Construction size={64} className="text-status-alert" />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-txt-body">{title}</h1>

        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-status-alert/10 px-3 py-1">
          <span className="text-sm font-semibold text-status-alert">
            En desarrollo
          </span>
        </div>

        {description && <p className="mb-8 text-txt-muted">{description}</p>}

        <div className="mb-8 rounded-lg bg-bg-paper p-4">
          <p className="text-sm text-txt-muted">
            El módulo{" "}
            <span className="font-semibold text-txt-body">{moduleName}</span>{" "}
            está en desarrollo.
            <br />
            Esta funcionalidad estará disponible próximamente.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}
