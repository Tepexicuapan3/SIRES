import { useEffect, useRef } from "react";
import { useNavigation } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import NProgress from "nprogress";
import "@/styles/nprogress.css";

/**
 * Barra de progreso de navegación superior.
 * Se integra con React Router para mostrar carga entre rutas.
 */
export const NavigationProgressBar = () => {
  const navigation = useNavigation();
  const isFetching = useIsFetching();
  const startTimeoutRef = useRef<number | null>(null);

  const ensureParent = () => {
    const parent = document.querySelector("#app-header-progress");
    if (!parent) return false;

    NProgress.configure({
      parent: "#app-header-progress",
      showSpinner: false,
      speed: 400,
      minimum: 0.1,
      trickleSpeed: 200,
    });

    const existing = document.getElementById("nprogress");
    if (existing && existing.parentElement !== parent) {
      existing.remove();
    }

    return true;
  };

  useEffect(() => {
    ensureParent();
    const frame = requestAnimationFrame(ensureParent);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Manejar estados de carga de loaders
  useEffect(() => {
    const shouldStart = navigation.state === "loading" || isFetching > 0;

    if (shouldStart) {
      if (startTimeoutRef.current !== null) {
        return;
      }
      startTimeoutRef.current = window.setTimeout(() => {
        if (ensureParent()) {
          NProgress.start();
        }
        startTimeoutRef.current = null;
      }, 120);
      return;
    }
    if (startTimeoutRef.current !== null) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    NProgress.done();
  }, [isFetching, navigation.state]);

  return null;
};
