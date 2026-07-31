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

  const handleCodigoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await verificarCodigo(identidad, codigo);
      setToken(result.accessToken);
      navigate("/", { replace: true });
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-center text-xl font-semibold text-slate-800">
          Citas en Línea
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
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
            <FormField
              id="codigo"
              label="Código de verificación (6 dígitos)"
              inputMode="numeric"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              autoComplete="one-time-code"
              value={codigo}
              onChange={(e) =>
                setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <Button loading={loading}>Verificar</Button>
          </form>
        )}
      </div>
    </div>
  );
}
