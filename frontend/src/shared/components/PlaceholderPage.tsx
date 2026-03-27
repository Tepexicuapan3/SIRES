import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";

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
  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-app p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-status-alert/10 p-6">
            <Construction
              aria-hidden="true"
              className="size-16 text-status-alert"
            />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-bold text-txt-body">{title}</h1>

        <div className="mb-4 flex justify-center">
          <Badge variant="alert">En desarrollo</Badge>
        </div>

        {description && <p className="mb-8 text-txt-muted">{description}</p>}

        <Card className="mb-8">
          <CardContent className="text-sm text-txt-muted">
            El módulo{" "}
            <span className="font-semibold text-txt-body">{moduleName}</span>{" "}
            está en desarrollo.
            <br />
            Esta funcionalidad estará disponible próximamente.
          </CardContent>
        </Card>

        <Button variant="outline" asChild className="gap-2">
          <Link to="/dashboard">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}
