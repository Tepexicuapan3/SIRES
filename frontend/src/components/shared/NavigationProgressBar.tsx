import { useEffect } from "react";
import { useLocation, useNavigation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

/**
 * Barra de progreso de navegación superior.
 * Se integra con React Router para mostrar carga entre rutas.
 */
export const NavigationProgressBar = () => {
  const location = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    // Configuración minimalista
    NProgress.configure({ 
      showSpinner: false, 
      speed: 400, 
      minimum: 0.1,
      trickleSpeed: 200
    });
  }, []);

  // Manejar cambios de ruta (Navegación completa)
  useEffect(() => {
    NProgress.start();
    // Pequeño timeout para asegurar que la barra se vea y termine suavemente
    const timer = setTimeout(() => NProgress.done(), 300);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]);

  // Manejar estados de carga de loaders (si usas data loaders de RR6)
  useEffect(() => {
    if (navigation.state === "loading") NProgress.start();
    else NProgress.done();
  }, [navigation.state]);

  return (
    <style>{`
      /* Personalización de NProgress */
      #nprogress {
        pointer-events: none;
      }

      /* Barra principal */
      #nprogress .bar {
        background: hsl(var(--brand)); /* Color Naranja Metro */
        position: fixed;
        z-index: 50; /* Encima del contenido, debajo de modales muy altos */
        top: 4rem; /* 64px (h-16) - Debajo del Header */
        left: 0;
        width: 100%;
        height: 3px; /* Un poco más gruesa para visibilidad */
      }

      /* Sombra brillante (Glow) */
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px hsl(var(--brand)), 0 0 5px hsl(var(--brand));
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }
    `}</style>
  );
};