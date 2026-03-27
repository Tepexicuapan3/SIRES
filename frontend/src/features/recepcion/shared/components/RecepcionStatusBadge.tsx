import { Badge } from "@shared/ui/badge";
import { VISIT_STATUS, type VisitStatus } from "@api/types";
import { formatVisitStatusLabel } from "@features/recepcion/shared/utils/recepcion-format";

interface RecepcionStatusBadgeProps {
  status: VisitStatus;
}

const STATUS_VARIANT: Record<
  VisitStatus,
  "stable" | "info" | "alert" | "critical" | "secondary"
> = {
  [VISIT_STATUS.EN_ESPERA]: "alert",
  [VISIT_STATUS.EN_SOMATOMETRIA]: "info",
  [VISIT_STATUS.LISTA_PARA_DOCTOR]: "secondary",
  [VISIT_STATUS.EN_CONSULTA]: "secondary",
  [VISIT_STATUS.CERRADA]: "stable",
  [VISIT_STATUS.CANCELADA]: "critical",
  [VISIT_STATUS.NO_SHOW]: "critical",
};

export const RecepcionStatusBadge = ({ status }: RecepcionStatusBadgeProps) => {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {formatVisitStatusLabel(status)}
    </Badge>
  );
};
