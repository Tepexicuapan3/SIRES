import { Button } from "@/components/ui/button";
import type { VisitStatus } from "@api/types";
import {
  VISIT_STAGE,
  isStageAvailableForStatus,
  type VisitStage,
} from "@features/flujo-clinico/domain/visit-flow.constants";

interface VisitStageNavigatorProps {
  currentStatus: VisitStatus;
  currentStage?: VisitStage;
  onStageChange?: (stage: VisitStage) => void;
}

const STAGE_ITEMS: Array<{ key: VisitStage; label: string }> = [
  { key: VISIT_STAGE.RECEPCION, label: "Recepcion" },
  { key: VISIT_STAGE.SOMATOMETRIA, label: "Somatometria" },
  { key: VISIT_STAGE.DOCTOR, label: "Doctor" },
];

export function VisitStageNavigator({
  currentStatus,
  currentStage,
  onStageChange,
}: VisitStageNavigatorProps) {
  return (
    <nav aria-label="Navegacion por etapa" className="flex gap-2">
      {STAGE_ITEMS.map((stage) => {
        const isEnabled = isStageAvailableForStatus(currentStatus, stage.key);
        const isCurrent = currentStage === stage.key;

        return (
          <Button
            key={stage.key}
            type="button"
            variant={isCurrent ? "default" : "outline"}
            size="sm"
            disabled={!isEnabled}
            aria-current={isCurrent ? "step" : undefined}
            onClick={() => {
              if (!isEnabled || !onStageChange) {
                return;
              }
              onStageChange(stage.key);
            }}
          >
            {stage.label}
          </Button>
        );
      })}
    </nav>
  );
}
