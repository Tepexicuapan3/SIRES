import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { visitsAPI } from "@api/resources/visits.api";
import { useSaveDiagnosis } from "@features/consulta-medica/modules/atencion/mutations/useSaveDiagnosis";
import { useSavePrescriptions } from "@features/consulta-medica/modules/atencion/mutations/useSavePrescriptions";
import { visitFlowKeys } from "@features/recepcion/shared/queries/visit-flow.keys";

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("doctor flow mutations", () => {
  it("useSaveDiagnosis llama API e invalida colas de flujo clinico", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = createWrapper(queryClient);

    const saveDiagnosisSpy = vi
      .spyOn(visitsAPI, "saveDiagnosis")
      .mockResolvedValue({
        visitId: 55,
        status: "en_consulta",
        primaryDiagnosis: "Dx",
        finalNote: "Nota",
      });
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const { result } = renderHook(() => useSaveDiagnosis(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        visitId: 55,
        data: {
          primaryDiagnosis: "Dx",
          finalNote: "Nota",
        },
      });
    });

    expect(saveDiagnosisSpy).toHaveBeenCalledWith(55, {
      primaryDiagnosis: "Dx",
      finalNote: "Nota",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: visitFlowKeys.lists(),
    });
  });

  it("useSavePrescriptions llama API e invalida colas de flujo clinico", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const wrapper = createWrapper(queryClient);

    const savePrescriptionsSpy = vi
      .spyOn(visitsAPI, "savePrescriptions")
      .mockResolvedValue({
        visitId: 55,
        status: "en_consulta",
        items: ["Paracetamol 500mg"],
      });
    const invalidateSpy = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    const { result } = renderHook(() => useSavePrescriptions(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        visitId: 55,
        data: {
          items: ["Paracetamol 500mg"],
        },
      });
    });

    expect(savePrescriptionsSpy).toHaveBeenCalledWith(55, {
      items: ["Paracetamol 500mg"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: visitFlowKeys.lists(),
    });
  });
});
