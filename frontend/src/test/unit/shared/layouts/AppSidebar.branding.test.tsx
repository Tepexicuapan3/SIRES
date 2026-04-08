import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/utils";
import { SidebarProvider } from "@shared/ui/sidebar";
import { AppSidebar } from "@shared/layouts/sidebar/AppSidebar";
import { useNavigation } from "@features/navigation/hooks/useNavigation";

vi.mock("@features/navigation/hooks/useNavigation", () => ({
  useNavigation: vi.fn(),
}));

vi.mock("@shared/layouts/sidebar/NavMain", () => ({
  NavMain: () => <div data-testid="nav-main">nav-main</div>,
}));

vi.mock("@shared/layouts/sidebar/NavSecondary", () => ({
  NavSecondary: () => <div data-testid="nav-secondary">nav-secondary</div>,
}));

vi.mock("@shared/layouts/sidebar/NavUser", () => ({
  NavUser: () => <div data-testid="nav-user">nav-user</div>,
}));

const mockedUseNavigation = vi.mocked(useNavigation);

const renderSidebar = () =>
  render(
    <SidebarProvider>
      <AppSidebar />
    </SidebarProvider>,
  );

describe("AppSidebar branding", () => {
  beforeEach(() => {
    mockedUseNavigation.mockReset();
  });

  it("shows SISEM branding in logo and institution label", () => {
    mockedUseNavigation.mockReturnValue({
      sections: [],
      secondaryItems: [],
      isEmpty: true,
    });

    renderSidebar();

    expect(screen.getByAltText("Logo SISEM")).toBeVisible();
    expect(screen.getByText("SISEM")).toBeVisible();
    expect(screen.getByText("STC Metro CDMX")).toBeVisible();
  });

  it("keeps empty navigation behavior unchanged", () => {
    mockedUseNavigation.mockReturnValue({
      sections: [],
      secondaryItems: [],
      isEmpty: true,
    });

    renderSidebar();

    expect(screen.getByText("No hay menús disponibles")).toBeVisible();
  });
});
