import { useEffect } from "react";
import { useNavigation } from "react-router-dom";
import NProgress from "nprogress";
import "@/styles/nprogress.css";

/**
 * Barra de progreso de navegación superior.
 * Se integra con React Router para mostrar carga entre rutas.
 */
export const NavigationProgressBar = () => {
  const navigation = useNavigation();

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
    if (navigation.state === "loading") {
      NProgress.start();
      return;
    }
    NProgress.done();
  }, [navigation.state]);

  return null;
};
