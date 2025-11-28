import { useEffect, useRef } from "react";

interface ParticlesProps {
  className?: string;
  quantity?: number; // Cantidad de partículas
  staticity?: number; // Qué tan "nerviosas" son (menor es más tranquilo)
  ease?: number; // Suavidad del movimiento
  refresh?: boolean; // Para forzar re-render si cambia el tema
}

export const ParticlesBackground = ({
  className = "",
  quantity = 200,
  staticity = 80,
  ease = 50,
}: ParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const circles = useRef<any[]>([]);
  const mouse = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  // Color Metro Orange
  const METRO_ORANGE = "#fe5000";
  const METRO_ORANGE_LINE = "rgba(254, 80, 0, 0.15)"; // Variante tenue para líneas

  // Configuración visual según el tema (se actualiza dinámicamente)
  const themeColors = useRef({
    color: METRO_ORANGE, // Partículas
    lineColor: METRO_ORANGE_LINE, // Líneas
  });

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
    initCanvas();
    animate();
    window.addEventListener("resize", initCanvas);

    // Observer para detectar cambio de clase 'dark' en el HTML
    // Esto permite que el canvas cambie de color sin recargar la página
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          updateThemeColors();
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    updateThemeColors(); // Inicializar colores

    return () => {
      window.removeEventListener("resize", initCanvas);
      observer.disconnect();
    };
  }, []);

  // Función para definir colores según el tema actual
  const updateThemeColors = () => {
    // Usar siempre Metro Orange y su variante tenue
    themeColors.current = {
      color: METRO_ORANGE,
      lineColor: METRO_ORANGE_LINE,
    };
  };

  useEffect(() => {
    onMouseMove();
  }, []);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const onMouseMove = () => {
    if (canvasRef.current) {
      window.addEventListener("mousemove", (e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const { w, h } = canvasSize.current;
          const x = e.clientX - rect.left - w / 2;
          const y = e.clientY - rect.top - h / 2;
          const inside = x < w / 2 && x > -w / 2 && y < h / 2 && y > -h / 2;
          if (inside) {
            mouse.current.x = x;
            mouse.current.y = y;
          }
        }
      });
    }
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = () => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const translateX = 0;
    const translateY = 0;
    const pSize = Math.floor(Math.random() * 2) + 1.5; // Tamaño pequeño (estilo médico)
    const alpha = 0;
    const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
    const dx = (Math.random() - 0.5) * 0.2; // Velocidad LENTA (Calma)
    const dy = (Math.random() - 0.5) * 0.2;
    const magnetism = 0.1 + Math.random() * 4;
    return {
      x,
      y,
      translateX,
      translateY,
      size: pSize,
      alpha,
      targetAlpha,
      dx,
      dy,
      magnetism,
    };
  };

  const drawCircle = (circle: any, update = false) => {
    if (context.current) {
      const { x, y, translateX, translateY, size, alpha } = circle;
      context.current.translate(translateX, translateY);
      context.current.beginPath();
      context.current.arc(x, y, size, 0, 2 * Math.PI);
      context.current.fillStyle = themeColors.current.color; // Color dinámico
      context.current.globalAlpha = alpha;
      context.current.fill();
      context.current.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!update) {
        circles.current.push(circle);
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h
      );
    }
  };

  const drawParticles = () => {
    clearContext();
    const particleCount = quantity;
    for (let i = 0; i < particleCount; i++) {
      const circle = circleParams();
      drawCircle(circle);
    }
  };

  const remapValue = (
    value: number,
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ) => {
    const remapped =
      ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
    return remapped > 0 ? remapped : 0;
  };

  // Lógica principal de dibujo frame por frame
  const animate = () => {
    clearContext();
    circles.current.forEach((circle: any, i: number) => {
      // Dibujar líneas entre partículas cercanas (Efecto Molécula/Red)
      // Esto da el look "Clínico/Científico"
      for (let j = i + 1; j < circles.current.length; j++) {
        const other = circles.current[j];
        const dx = circle.x - other.x;
        const dy = circle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Si están cerca (menos de 100px), dibujar línea
        if (distance < 120) {
          if (context.current) {
            context.current.beginPath();
            context.current.moveTo(circle.x, circle.y);
            context.current.lineTo(other.x, other.y);
            context.current.strokeStyle = themeColors.current.lineColor;
            // La opacidad de la línea depende de la distancia (más cerca = más fuerte)
            context.current.globalAlpha = 1 - distance / 120;
            context.current.lineWidth = 0.6;
            context.current.stroke();
          }
        }
      }

      // Física de la partícula
      const edge = [
        circle.x + circle.translateX - circle.size, // distance from left edge
        canvasSize.current.w - circle.x - circle.translateX - circle.size, // distance from right edge
        circle.y + circle.translateY - circle.size, // distance from top edge
        canvasSize.current.h - circle.y - circle.translateY - circle.size, // distance from bottom edge
      ];
      const closestEdge = edge.reduce((a, b) => Math.min(a, b));
      const remapClosestEdge = parseFloat(
        remapValue(closestEdge, 0, 20, 0, 1).toFixed(2)
      );
      if (remapClosestEdge > 1) {
        circle.alpha += 0.02;
        if (circle.alpha > circle.targetAlpha) {
          circle.alpha = circle.targetAlpha;
        }
      } else {
        circle.alpha = circle.targetAlpha * remapClosestEdge;
      }
      circle.x += circle.dx;
      circle.y += circle.dy;
      circle.translateX +=
        (mouse.current.x / (staticity / circle.magnetism) - circle.translateX) /
        ease;
      circle.translateY +=
        (mouse.current.y / (staticity / circle.magnetism) - circle.translateY) /
        ease;

      // Rebote en los bordes
      if (
        circle.x < -circle.size ||
        circle.x > canvasSize.current.w + circle.size ||
        circle.y < -circle.size ||
        circle.y > canvasSize.current.h + circle.size
      ) {
        // En lugar de matar la partícula, la hacemos rebotar suavemente
        circle.x = Math.random() * canvasSize.current.w;
        circle.y = Math.random() * canvasSize.current.h;
        circle.alpha = 0;
      }
      drawCircle(circle, true);
    });
    window.requestAnimationFrame(animate);
  };

  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none ${className}`}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};
