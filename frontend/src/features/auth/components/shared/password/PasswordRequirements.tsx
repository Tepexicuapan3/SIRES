import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PasswordRequirements - Validación Visual en Tiempo Real
 *
 * PROPÓSITO:
 * Mostrar feedback progresivo mientras el usuario tipea su contraseña.
 * Resuelve el problema de "validación solo al submit" identificado en análisis UX.
 *
 * PATRÓN UX:
 * - Check verde: Requisito cumplido
 * - X gris: Requisito pendiente
 * - Transiciones suaves de color/ícono
 *
 * @see AuthPasswordForm.tsx - Integración con React Hook Form
 */

interface Props {
  password: string;
}

interface Requirement {
  id: string;
  label: string;
  test: (pwd: string) => boolean;
}

const requirements: Requirement[] = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    test: (pwd) => pwd.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos una mayúscula (A-Z)",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    id: "number",
    label: "Al menos un número (0-9)",
    test: (pwd) => /[0-9]/.test(pwd),
  },
  {
    id: "special",
    label: "Al menos un carácter especial (@, #, $, etc.)",
    test: (pwd) => /[^a-zA-Z0-9]/.test(pwd),
  },
];

export const PasswordRequirements = ({ password }: Props) => {
  const results = requirements.map((req) => ({
    req,
    isMet: req.test(password),
  }));
  const metCount = results.filter((item) => item.isMet).length;
  const progressPercent = Math.round((metCount / requirements.length) * 100);
  const progressClass =
    metCount === 0
      ? "w-0 bg-txt-muted"
      : metCount === requirements.length
        ? "w-full bg-status-stable"
        : metCount >= 2
          ? "bg-status-alert"
          : "bg-status-critical";

  return (
    <div className="space-y-2 p-4 rounded-lg bg-subtle/30 border border-line-hairline">
      <p className="text-xs font-semibold text-txt-body mb-3">
        Requisitos de Contraseña:
      </p>
      <ul className="space-y-2">
        {results.map(({ req, isMet }) => {
          return (
            <li
              key={req.id}
              className={cn(
                "flex items-start gap-2 text-xs transition-colors duration-200",
                isMet ? "text-status-stable" : "text-txt-muted",
              )}
            >
              {/* Ícono Check/X */}
              <span className="shrink-0 mt-0.5">
                {isMet ? (
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <X size={14} strokeWidth={2} aria-hidden="true" />
                )}
              </span>

              {/* Label del Requisito */}
              <span className={cn("leading-tight", isMet && "font-medium")}>
                {req.label}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Barra de Progreso Visual */}
      <div className="mt-4 pt-3 border-t border-line-hairline">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-line-struct rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                progressClass,
              )}
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
          <span className="text-xs text-txt-muted font-medium tabular-nums">
            {metCount}/{requirements.length}
          </span>
        </div>
      </div>
    </div>
  );
};
