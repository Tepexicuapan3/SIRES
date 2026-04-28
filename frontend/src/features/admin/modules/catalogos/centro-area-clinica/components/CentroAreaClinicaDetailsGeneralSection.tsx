import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Separator } from "@shared/ui/separator";
import type { CentroAreaClinicaDetail } from "@api/types";
import {
  CATALOG_STATUS,
  type CatalogStatus,
} from "@features/admin/modules/catalogos/shared/domain/catalog-status";

interface CentroAreaClinicaDetailsGeneralSectionProps {
  detail: CentroAreaClinicaDetail;
  onStatusChange?: (nextActive: boolean) => void;
  isStatusPending?: boolean;
  isEditable?: boolean;
}

export function CentroAreaClinicaDetailsGeneralSection({
  detail,
  onStatusChange,
  isStatusPending = false,
  isEditable = true,
}: CentroAreaClinicaDetailsGeneralSectionProps) {
  const statusValue: CatalogStatus = detail.isActive
    ? CATALOG_STATUS.ACTIVE
    : CATALOG_STATUS.INACTIVE;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Centro de atención</Label>
          <Input value={detail.center.name} disabled />
        </div>
        <div className="space-y-2">
          <Label>Área clínica</Label>
          <Input value={detail.areaClinica.name} disabled />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select
            value={statusValue}
            onValueChange={(value) => {
              if (!onStatusChange || !isEditable) return;
              if (value === statusValue) return;
              onStatusChange(value === CATALOG_STATUS.ACTIVE);
            }}
            disabled={!onStatusChange || isStatusPending || !isEditable}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CATALOG_STATUS.ACTIVE}>Activa</SelectItem>
              <SelectItem value={CATALOG_STATUS.INACTIVE}>Inactiva</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />
    </div>
  );
}
