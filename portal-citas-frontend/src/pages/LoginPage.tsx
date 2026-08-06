import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import {
  capturarCorreo,
  iniciarSesion,
  verificarCodigo,
  type Identidad,
} from "@/api/portalAuth.api";
import { ApiError } from "@/api/client";
import { setToken } from "@/api/authStore";
import FormField from "@/components/FormField";
import Button from "@/components/Button";
import ErrorAlert from "@/components/ErrorAlert";
import OtpInput from "@/components/OtpInput";
import { ParticlesBackground } from "@/components/ParticlesBackground";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10; // apps/portal_citas/services/otp_service.py#OTP_TTL_MINUTES

type Step = "identidad" | "correo" | "codigo";

const DEFAULT_IDENTIDAD: Identidad = {
  noExp: "",
  nombreCompleto: "",
  fechaNacimiento: "",
};

/** Mapea códigos de error de dominio a mensajes de UI. Genérico a propósito
 * para IDENTIDAD_NO_ENCONTRADA (mismo criterio de seguridad que ya aplica
 * el backend: no revelar cuál de los 3 datos falló). */
function messageFor(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("identidad");
  const [identidad, setIdentidad] = useState<Identidad>(DEFAULT_IDENTIDAD);
  const [correo, setCorreo] = useState("");
  const [correoEnmascarado, setCorreoEnmascarado] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIdentidadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await iniciarSesion(identidad);
      if (result.requiereCorreo) {
        setStep("correo");
      } else {
        setCorreoEnmascarado(result.correoEnmascarado);
        setStep("codigo");
      }
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCorreoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await capturarCorreo(identidad, correo);
      setCorreoEnmascarado(result.correoEnmascarado);
      setStep("codigo");
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  };

  const submitCodigo = async (codeValue: string) => {
    if (loading) return; // evita doble submit (botón + auto-verificación al completar las 6 cajas)
    setError(null);
    setLoading(true);
    try {
      const result = await verificarCodigo(identidad, codeValue);
      setToken(result.accessToken);
      navigate("/", { replace: true });
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCodigoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitCodigo(codigo);
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-app p-4">
      <ParticlesBackground quantity={300} staticity={7} ease={50} />
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-radial-[at_center_center] from-transparent via-transparent to-app/90"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-line-struct bg-paper/85 p-6 sm:p-8 shadow-2xl shadow-brand/5 backdrop-blur-md">
        <div className="mb-4 flex flex-col items-center">
          <div className="mb-3 flex items-center justify-center gap-1">
            <img
              src="/assets/brand/logos/primary/sisem.webp"
              alt="Logo SISEM"
              className="h-28 w-28 shrink-0 object-contain drop-shadow-lg sm:h-36 sm:w-36"
            />

            {/* Conector tipo red: línea con un nodo fijo en cada extremo
                (los dos sistemas) + un pulso que viaja de uno al otro
                (`network-pulse`, definido en styles/theme.css) — misma
                metáfora visual que las conexiones entre nodos del fondo
                animado (ParticlesBackground). */}
            <div
              className="relative flex h-6 w-16 shrink-0 items-center sm:w-20"
              aria-hidden="true"
            >
              <span className="absolute left-0 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-line-struct" />
              <span className="h-px w-full bg-gradient-to-r from-line-struct via-brand/60 to-line-struct" />
              <span className="absolute right-0 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-line-struct" />
              <span className="animate-network-pulse absolute top-1/2 size-2.5 rounded-full bg-brand shadow-[0_0_10px_var(--action-main)]" />
            </div>

            <img
              src="/assets/brand/logos/secondary/logo_portal_citas.png"
              alt="Logo Citas en Línea"
              className="h-28 w-28 shrink-0 object-contain drop-shadow-lg sm:h-36 sm:w-36"
            />
          </div>
          <h1 className="text-center text-xl font-display font-semibold text-txt-body sm:text-2xl">
            CITAS SISEM EN LÍNEA
          </h1>
          <p className="mt-0.5 text-center text-[11px] font-medium tracking-wide text-txt-hint uppercase">
            Integrado con SISEM
          </p>
        </div>
        <p className="mb-6 text-center text-sm text-txt-muted">
          {step === "identidad" && "Ingresa tus datos para iniciar sesión"}
          {step === "correo" && "Necesitamos tu correo para enviarte un código"}
          {step === "codigo" &&
            `Te enviamos un código a ${correoEnmascarado || "tu correo"}`}
        </p>

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        )}

        {step === "identidad" && (
          <form className="flex flex-col gap-4" onSubmit={handleIdentidadSubmit}>
            <FormField
              id="noExp"
              label="Número de expediente"
              maxLength={20}
              required
              autoComplete="off"
              value={identidad.noExp}
              onChange={(e) =>
                setIdentidad((prev) => ({ ...prev, noExp: e.target.value }))
              }
            />
            <FormField
              id="nombreCompleto"
              label="Nombre completo"
              maxLength={255}
              required
              autoComplete="name"
              value={identidad.nombreCompleto}
              onChange={(e) =>
                setIdentidad((prev) => ({
                  ...prev,
                  nombreCompleto: e.target.value,
                }))
              }
            />
            <FormField
              id="fechaNacimiento"
              label="Fecha de nacimiento"
              type="date"
              required
              value={identidad.fechaNacimiento}
              onChange={(e) =>
                setIdentidad((prev) => ({
                  ...prev,
                  fechaNacimiento: e.target.value,
                }))
              }
            />
            <Button loading={loading}>Continuar</Button>
          </form>
        )}

        {step === "correo" && (
          <form className="flex flex-col gap-4" onSubmit={handleCorreoSubmit}>
            <FormField
              id="correo"
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
            <Button loading={loading}>Enviar código</Button>
          </form>
        )}

        {step === "codigo" && (
          <form className="flex flex-col gap-4" onSubmit={handleCodigoSubmit}>
            <div className="flex flex-col items-center gap-3">
              <OtpInput
                length={OTP_LENGTH}
                value={codigo}
                onChange={(value) => {
                  setCodigo(value);
                  if (error) setError(null);
                }}
                onComplete={submitCodigo}
                disabled={loading}
                hasError={!!error}
                autoFocus
              />
              <p className="text-center text-xs text-txt-hint">
                El código expira en {OTP_TTL_MINUTES} minutos.
              </p>
            </div>
            <Button loading={loading} disabled={codigo.length !== OTP_LENGTH}>
              Verificar
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
