import { useState } from "react";
import { usersAPI } from "@api/resources/users.api";
import type { EmpleadoSermedResult } from "@api/types";

interface EmpleadoSermedLookupState {
  result: EmpleadoSermedResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useEmpleadoSermedLookup() {
  const [state, setState] = useState<EmpleadoSermedLookupState>({
    result: null,
    isLoading: false,
    error: null,
  });

  const lookup = async (noExp: string) => {
    const trimmed = noExp.trim();
    if (!trimmed) return;

    setState({ result: null, isLoading: true, error: null });

    try {
      const response = await usersAPI.lookupEmpleadoSermed(trimmed);
      setState({ result: response.empleado, isLoading: false, error: null });
      return response.empleado;
    } catch {
      setState({
        result: null,
        isLoading: false,
        error: "No se encontró el expediente en SERMED",
      });
      return null;
    }
  };

  const reset = () => {
    setState({ result: null, isLoading: false, error: null });
  };

  return { ...state, lookup, reset };
}
