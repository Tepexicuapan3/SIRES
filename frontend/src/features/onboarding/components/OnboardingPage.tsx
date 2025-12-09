import { useState } from "react";
import { TermsStep } from "./TermsStep";
import { ChangePasswordStep } from "./ChangePasswordStep";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/api/resources/auth.api";
import { useNavigate } from "react-router-dom";

export const OnboardingPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    authAPI.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Header simple */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleLogout}
          className="text-sm text-txt-muted hover:text-status-critical flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-paper transition-colors"
        >
          <LogOut size={16} /> Cerrar Sesión
        </button>
      </div>

      <div className="w-full max-w-2xl bg-paper rounded-xl shadow-2xl border border-line-struct overflow-hidden">
        {/* Barra de Progreso */}
        <div className="h-2 bg-paper-hover w-full flex">
          <div
            className={cn(
              "h-full bg-brand transition-all duration-500",
              step === 1 ? "w-1/2" : "w-full"
            )}
          />
        </div>

        <div className="p-8">
          {step === 1 ? (
            <TermsStep onAccept={() => setStep(2)} />
          ) : (
            <ChangePasswordStep />
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-txt-muted">
        Sistema de Información de Registro Electrónico para la Salud (SIRES)
      </p>
    </div>
  );
};

// Helper simple para clases condicionales (si no tienes cn)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
