import { Badge } from "@shared/ui/badge";
import {
  RECEPCION_SERVICE,
  type RecepcionService,
} from "@features/recepcion/shared/domain/recepcion.services";
import { formatRecepcionServiceLabel } from "@features/recepcion/shared/utils/recepcion-format";

interface RecepcionServiceBadgeProps {
  service: RecepcionService;
}

const SERVICE_VARIANT: Record<
  RecepcionService,
  "stable" | "info" | "critical" | "secondary"
> = {
  [RECEPCION_SERVICE.MEDICINA_GENERAL]: "stable",
  [RECEPCION_SERVICE.ESPECIALIDAD]: "info",
  [RECEPCION_SERVICE.URGENCIAS]: "critical",
  [RECEPCION_SERVICE.SIN_CLASIFICAR]: "secondary",
};

export const RecepcionServiceBadge = ({
  service,
}: RecepcionServiceBadgeProps) => {
  return (
    <Badge variant={SERVICE_VARIANT[service]}>
      {formatRecepcionServiceLabel(service)}
    </Badge>
  );
};
