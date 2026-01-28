import type { ReactElement } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
  type RenderOptions,
} from "@testing-library/react";
import { TestProviders } from "@/test/providers";

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) => render(ui, { wrapper: TestProviders, ...options });

export {
  act,
  cleanup,
  customRender as render,
  fireEvent,
  renderHook,
  screen,
  waitFor,
  within,
};
