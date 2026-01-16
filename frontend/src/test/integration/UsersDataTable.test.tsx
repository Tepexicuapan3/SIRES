import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "../utils";
import { UsersDataTable } from "@/features/admin/components/users/UsersDataTable";
import { useUsersFilters } from "@/features/admin/hooks/useUsersFilters";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

// Componente Wrapper para inyectar el hook de filtros
// Esto simula cómo UsersPage usa UsersDataTable
const TestWrapper = () => {
  const filtersHook = useUsersFilters();
  return <UsersDataTable filtersHook={filtersHook} />;
};

describe("UsersDataTable Integration", () => {
  it("renders the list of users fetched from the API", async () => {
    render(<TestWrapper />);

    // 1. Verificar encabezados de la tabla (confirmar que se renderizó la estructura)
    expect(screen.getByText("Usuario")).toBeInTheDocument();
    expect(screen.getByText("Nombre")).toBeInTheDocument();

    // 2. Esperar a que desaparezca el esqueleto/loading y aparezcan los datos
    // Los datos vienen de nuestros factories en handlers/users.ts
    await waitFor(() => {
        // Buscamos filas de la tabla (tbody > tr)
        // Nota: shadcn Table usa roles semánticos, podemos buscar por role "row"
        // pero excluimos el header
        const rows = screen.getAllByRole("row");
        // Header + 5 usuarios mockeados = 6 filas
        expect(rows.length).toBeGreaterThan(1);
    }, { timeout: 3000 });
  });

  it("handles empty state correctly", async () => {
    // Sobreescribir handler para devolver lista vacía
    server.use(
      http.get("*/users", () => {
        return HttpResponse.json({
          items: [],
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0
        });
      })
    );

    render(<TestWrapper />);

    await waitFor(() => {
       // El texto exacto depende de UsersDataTable.tsx
       // "No hay usuarios registrados"
       expect(screen.getByText(/no hay usuarios registrados/i)).toBeInTheDocument();
    });
  });
});