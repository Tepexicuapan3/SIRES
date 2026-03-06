import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import RecepcionQueuePage from "@features/recepcion/modules/checkin/pages/RecepcionCheckinPage";

const AgendaProbe = () => {
  const location = useLocation();

  return <p>Agenda {location.search}</p>;
};

describe("RecepcionQueuePage compatibility", () => {
  it("redirecciona check-in legacy a citas y check-in operativo", () => {
    render(
      <MemoryRouter initialEntries={["/recepcion/checkin"]}>
        <Routes>
          <Route path="/recepcion/checkin" element={<RecepcionQueuePage />} />
          <Route
            path="/recepcion/agenda"
            element={<p>Agenda operativa cargada</p>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Agenda operativa cargada")).toBeVisible();
  });

  it("preserva filtros legacy al redireccionar", () => {
    render(
      <MemoryRouter initialEntries={["/recepcion/checkin?folio=VST-777"]}>
        <Routes>
          <Route path="/recepcion/checkin" element={<RecepcionQueuePage />} />
          <Route path="/recepcion/agenda" element={<AgendaProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByText("Agenda ?folio=VST-777&focus=checkin"),
    ).toBeVisible();
  });

  it("redirige agendar-cita legacy al flujo unificado", () => {
    render(
      <MemoryRouter initialEntries={["/recepcion/agendar-cita"]}>
        <Routes>
          <Route
            path="/recepcion/agendar-cita"
            element={<RecepcionQueuePage />}
          />
          <Route path="/recepcion/agenda" element={<AgendaProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Agenda ?focus=checkin")).toBeVisible();
  });

  it("redirige fichas legacy al flujo unificado", () => {
    render(
      <MemoryRouter initialEntries={["/recepcion/fichas/urgencias"]}>
        <Routes>
          <Route
            path="/recepcion/fichas/urgencias"
            element={<RecepcionQueuePage />}
          />
          <Route path="/recepcion/agenda" element={<AgendaProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Agenda ?focus=checkin")).toBeVisible();
  });
});
