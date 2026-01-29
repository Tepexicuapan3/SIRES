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

  useEffect(() => {
    NProgress.configure({ parent: "#app-header-progress" });
  }, []);

  useEffect(() => {
    // Configuración minimalista
    NProgress.configure({
      showSpinner: false,
      speed: 400,
      minimum: 0.1,
      trickleSpeed: 200,
    });
  }, []);

  // Manejar estados de carga de loaders
  useEffect(() => {
    const shouldStart = navigation.state === "loading" || isFetching > 0;

    if (shouldStart) {
      if (startTimeoutRef.current !== null) {
        return;
      }
      startTimeoutRef.current = window.setTimeout(() => {
        NProgress.start();
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
