import { useEffect } from "react";
import { useLocation, useNavigation } from "react-router-dom";
import NProgress from "nprogress";

export const NavigationProgressBar = () => {
  const location = useLocation();
  const navigation = useNavigation();

  useEffect(() => {
    NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.1 });
  }, []);

  // Detectar cambio de URL
  useEffect(() => {
    NProgress.start();
    const timer = setTimeout(() => NProgress.done(), 200);
    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]);

  // Detectar carga de datos
  useEffect(() => {
    if (navigation.state === "loading") NProgress.start();
    else NProgress.done();
  }, [navigation.state]);

  return null;
};
