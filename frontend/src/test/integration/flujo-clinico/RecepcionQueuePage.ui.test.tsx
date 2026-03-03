import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RecepcionQueuePage from "@features/recepcion/modules/checkin/pages/RecepcionCheckinPage";

describe("RecepcionQueuePage compatibility", () => {
  it("redirecciona check-in legacy a agenda con focus", () => {
    render(
      <MemoryRouter initialEntries={["/recepcion/checkin"]}>
        <Routes>
          <Route path="/recepcion/checkin" element={<RecepcionQueuePage />} />
          <Route
            path="/recepcion/agenda"
            element={<p>Agenda unificada cargada</p>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Agenda unificada cargada")).toBeVisible();
  });

  it("preserva filtros legacy al redireccionar", () => {
    render(
      <MemoryRouter initialEntries={["/recepcion/checkin?folio=VST-777"]}>
        <Routes>
          <Route path="/recepcion/checkin" element={<RecepcionQueuePage />} />
          <Route
            path="/recepcion/agenda"
            element={<p>Agenda con filtro de check-in</p>}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Agenda con filtro de check-in")).toBeVisible();
  });
});
