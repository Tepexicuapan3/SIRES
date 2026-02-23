import { useEffect, useRef } from "react";
import { useNavigation } from "react-router-dom";
import { useIsFetching } from "@tanstack/react-query";
import NProgress from "nprogress";
import "@/styles/nprogress.css";

/**
 * Barra de progreso global en el borde superior.
 * Se integra con React Router y TanStack Query para mostrar carga.
 */
export const NavigationProgressBar = () => {
  const navigation = useNavigation();
  const isFetching = useIsFetching();
  const startTimeoutRef = useRef<number | null>(null);
  const doneTimeoutRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    NProgress.configure({
      showSpinner: false,
      speed: 400,
      minimum: 0.1,
      trickleSpeed: 200,
    });

    return () => {
      if (startTimeoutRef.current !== null) {
        window.clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      if (doneTimeoutRef.current !== null) {
        window.clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
      }
      if (isActiveRef.current) {
        NProgress.done(true);
      } else {
        NProgress.remove();
      }
      isActiveRef.current = false;
      startTimeRef.current = null;
    };
  }, []);

  // Manejar estados de carga de loaders
  useEffect(() => {
    const shouldStart = navigation.state === "loading" || isFetching > 0;
    const minimumDurationMs = 240;

    if (isInitialLoadRef.current) {
      if (!shouldStart) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    if (shouldStart) {
      if (doneTimeoutRef.current !== null) {
        window.clearTimeout(doneTimeoutRef.current);
        doneTimeoutRef.current = null;
      }
      if (isActiveRef.current) {
        return;
      }
      if (startTimeoutRef.current !== null) {
        return;
      }
      startTimeoutRef.current = window.setTimeout(() => {
        if (!isActiveRef.current) {
          NProgress.start();
          isActiveRef.current = true;
          startTimeRef.current = Date.now();
        }
        startTimeoutRef.current = null;
      }, 120);
      return;
    }
    if (startTimeoutRef.current !== null) {
      window.clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }
    if (!isActiveRef.current) {
      return;
    }

    const startedAt = startTimeRef.current ?? Date.now();
    const elapsed = Date.now() - startedAt;
    const remaining = minimumDurationMs - elapsed;

    if (remaining > 0) {
      doneTimeoutRef.current = window.setTimeout(() => {
        NProgress.done();
        isActiveRef.current = false;
        startTimeRef.current = null;
        doneTimeoutRef.current = null;
      }, remaining);
      return;
    }

    NProgress.done();
    isActiveRef.current = false;
    startTimeRef.current = null;
  }, [isFetching, navigation.state]);

  return null;
};
