import { useEffect, useRef } from "react";

/**
 * ParticlesBackground - Sistema de partículas profesional con temática clínica/científica
 *
 * Inspiración: Redes moleculares, datos médicos, estructuras hexagonales (células, honeycomb)
 * Paleta: Metro CDMX (naranja #fe5000) con acentos grises técnicos
 * Performance: Optimizado con spatial hashing + object pooling para 60fps estables
 */

// ============================================================================
// TIPOS Y CONSTANTES
// ============================================================================

interface ParticlesProps {
  className?: string;
  quantity?: number; // Cantidad de partículas (afecta nodos + dots, NO hexágonos)
  staticity?: number; // Resistencia al mouse (mayor = menos movimiento)
  ease?: number; // Suavidad de la interacción (menor = más fluido)
  refresh?: boolean; // Trigger para forzar re-render
}

/** Partícula individual (nodo o dot) */
interface Particle {
  x: number; // Posición actual
  y: number;
  vx: number; // Velocidad (movimiento browniano + física)
  vy: number;
  baseVx: number; // Velocidad base browniana (NUEVO - movimiento constante)
  baseVy: number; // NUEVO
  tx: number; // Traducción por mouse (desplazamiento extra)
  ty: number;
  radius: number; // Tamaño del círculo
  alpha: number; // Opacidad actual
  targetAlpha: number; // Opacidad objetivo (fade in progresivo)
  type: "node" | "dot"; // Tipo: nodo grande con conexiones o dot pequeño decorativo
  magnetism: number; // Sensibilidad al mouse (cada partícula reacciona diferente)
  pulsePhase: number; // Fase de la animación de pulsación (0-2π)
  mass: number; // NUEVO - Masa de la partícula (afecta empujón del mouse)
  trail: Array<{ x: number; y: number; alpha: number }>; // NUEVO - Trail visual
}

/** Hexágono estructural (decoración reactiva al mouse) */
interface Hexagon {
  x: number; // Posición base (original)
  y: number;
  tx: number; // Translación temporal por mouse (push effect)
  ty: number;
  size: number; // Radio del círculo que inscribe el hexágono
  rotation: number; // Rotación actual (radianes)
  baseRotationSpeed: number; // Velocidad base de rotación (rad/frame)
  currentRotationSpeed: number; // Velocidad actual (afectada por mouse)
}

/** Estado del mouse */
interface Mouse {
  x: number; // Coordenadas relativas al centro del canvas
  y: number;
  radius: number; // Radio de influencia (repulsión de partículas)
}

/** Celda del spatial grid (para optimizar detección de conexiones) */
interface GridCell {
  particles: Particle[]; // Partículas en esta celda
}

// Paleta de colores Metro CDMX (clínica, profesional, tecnológica)
const COLOR_FALLBACKS = {
  brand: "#fe5000",
  textHint: "#94a3b8",
  textMuted: "#64748b",
  borderStruct: "#cbd5e1",
} as const;

// Configuración del sistema de partículas
const CONFIG = {
  // Distribución de tipos (% de quantity)
  nodeRatio: 0.2, // 20% son nodos grandes con conexiones
  dotRatio: 0.8, // 80% son dots decorativos

  // Hexágonos (cantidad fija, no escala con quantity)
  hexagonCount: 7, // 7 hexágonos estructurales

  // Tamaños
  nodeRadius: 3.5, // Radio de nodos principales
  dotRadius: 1.5, // Radio de dots pequeños
  hexagonSize: 80, // Tamaño base de hexágonos (varía ±30%)

  // Velocidades (movimiento browniano base)
  nodeSpeed: 0.3, // Nodos se mueven lento (parecen flotar)
  dotSpeed: 0.5, // Dots más rápidos (efecto de flujo de datos)

  // Conexiones
  connectionDistance: 150, // Distancia máxima para dibujar línea
  connectionWidthMin: 0.5, // Grosor mínimo de líneas (cuando están lejos)
  connectionWidthMax: 2, // Grosor máximo (cuando están muy cerca)

  // Mouse interaction - FÍSICA AVANZADA
  mouseRadius: 150, // Radio de influencia del mouse (zona de empujón)
  mousePushStrength: 3, // Fuerza del empujón físico (0.5 = suave, 2 = agresivo)
  maxParticleSpeed: 5, // Velocidad máxima de partículas (evita que se disparen)
  friction: 0.92, // Fricción para desaceleración (0.9 = rápido, 0.98 = lento)
  mouseConnectionDist: 200, // Distancia para crear conexión temporal mouse→nodo

  // Masa de partículas (NUEVO)
  nodeMass: 1.5, // Nodos grandes = más masa → menos afectados por empujón
  dotMass: 1.0, // Dots pequeños = poca masa → muy afectados

  // Gravedad sutil hacia el centro (NUEVO)
  centerGravityStrength: 0.0008, // Fuerza débil hacia el centro (evita acumulación en bordes)

  // Trail visual (NUEVO)
  enableTrail: true, // Activar/desactivar trail
  trailLength: 8, // Cantidad de puntos en el trail
  trailMinSpeed: 2, // Velocidad mínima para activar trail (px/frame)

  // Hexágonos reactivos
  hexagonMousePush: 0.3, // Qué tanto se mueven los hexágonos (0-1)
  hexagonRotationBoost: 5, // Multiplicador de rotación cerca del mouse

  // Visual feedback
  pushFlashThreshold: 0.3, // Fuerza mínima para activar flash visual

  // Animaciones
  pulseSpeed: 0.02, // Velocidad de pulsación de nodos
  pulseAmplitude: 0.15, // Amplitud de pulsación (±15% del tamaño)
  hexagonRotationSpeed: 0.001, // Rotación ultra lenta base

  // Performance (spatial hashing)
  gridCellSize: 150, // Tamaño de celda del grid (debe ser >= connectionDistance)
} as const;

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ParticlesBackground = ({
  className = "",
  quantity = 200, // Default: 150 partículas (30 nodos + 120 dots)
  staticity = 80, // Default: resistencia media
  ease = 50, // Default: suavidad media
}: ParticlesProps) => {
  // =========================================================================
  // REFS (no causan re-render, persisten entre frames)
  // =========================================================================

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Arrays de entidades
  const particlesRef = useRef<Particle[]>([]);
  const hexagonsRef = useRef<Hexagon[]>([]);

  // Esquema de color activo
  const colorsRef = useRef({
    primary: "rgba(254, 80, 0, 0.8)",
    primaryGlow: "rgba(254, 80, 0, 0.3)",
    node: "rgba(148, 163, 184, 0.6)",
    nodeGlow: "rgba(148, 163, 184, 0.2)",
    connection: "rgba(203, 213, 225, 0.15)",
    connectionActive: "rgba(254, 80, 0, 0.4)",
    hexagon: "rgba(241, 245, 249, 0.03)",
    hexagonStroke: "rgba(203, 213, 225, 0.1)",
    hexagonStrokeWidth: 1,
  });

  const toRgba = (value: string, alpha: number): string => {
    const trimmed = value.trim();
    if (!trimmed) return `rgba(0, 0, 0, ${alpha})`;
    if (trimmed.startsWith("rgba")) {
      const parts = trimmed.match(/\d+(?:\.\d+)?/g);
      if (!parts || parts.length < 3) return trimmed;
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
    if (trimmed.startsWith("rgb")) {
      const parts = trimmed.match(/\d+(?:\.\d+)?/g);
      if (!parts || parts.length < 3) return trimmed;
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
    if (trimmed.startsWith("#")) {
      const hex = trimmed.replace("#", "");
      const normalized =
        hex.length === 3
          ? hex
              .split("")
              .map((char) => char + char)
              .join("")
          : hex;
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return trimmed;
  };

  const readCssVar = (name: string, fallback: string): string => {
    if (typeof document === "undefined") return fallback;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return value || fallback;
  };

  // Estado del mouse
  const mouseRef = useRef<Mouse>({ x: 0, y: 0, radius: CONFIG.mouseRadius });

  // Dimensiones del canvas
  const canvasSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Spatial grid (optimización para detectar conexiones sin O(n²))
  const spatialGridRef = useRef<Map<string, GridCell>>(new Map());

  // AnimationFrame ID (para cleanup)
  const rafIdRef = useRef<number>(0);

  // DPR para pantallas retina
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;

  // =========================================================================
  // UTILIDADES
  // =========================================================================

  /**
   * Genera clave de celda del spatial grid
   * Permite agrupar partículas en "buckets" para búsqueda O(1) en lugar de O(n)
   */
  const getGridKey = (x: number, y: number): string => {
    const gridX = Math.floor(x / CONFIG.gridCellSize);
    const gridY = Math.floor(y / CONFIG.gridCellSize);
    return `${gridX},${gridY}`;
  };

  /**
   * Obtiene celdas vecinas de una posición (incluyendo la propia)
   * Para conexiones, necesitamos revisar 9 celdas (3x3) alrededor
   */
  const getNeighborCells = (x: number, y: number): GridCell[] => {
    const cells: GridCell[] = [];
    const gridX = Math.floor(x / CONFIG.gridCellSize);
    const gridY = Math.floor(y / CONFIG.gridCellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const cell = spatialGridRef.current.get(key);
        if (cell) cells.push(cell);
      }
    }

    return cells;
  };

  /**
   * Actualiza el spatial grid con las posiciones actuales de partículas
   * Se ejecuta cada frame ANTES de dibujar conexiones
   */
  const updateSpatialGrid = () => {
    spatialGridRef.current.clear();

    particlesRef.current.forEach((particle) => {
      const key = getGridKey(particle.x, particle.y);
      let cell = spatialGridRef.current.get(key);

      if (!cell) {
        cell = { particles: [] };
        spatialGridRef.current.set(key, cell);
      }

      cell.particles.push(particle);
    });
  };

  // =========================================================================
  // INICIALIZACIÓN DE ENTIDADES
  // =========================================================================

  /**
   * Crea una partícula individual (nodo o dot)
   * Object pooling: reusar objetos en lugar de crearlos/destruirlos mejora GC
   */
  const createParticle = (type: "node" | "dot"): Particle => {
    const { w, h } = canvasSizeRef.current;

    // Velocidad base browniana (movimiento constante sin interacción)
    const baseSpeed = type === "node" ? CONFIG.nodeSpeed : CONFIG.dotSpeed;
    const baseVx = (Math.random() - 0.5) * baseSpeed;
    const baseVy = (Math.random() - 0.5) * baseSpeed;

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: baseVx, // Comienza con velocidad base
      vy: baseVy,
      baseVx, // Guardamos la velocidad base para mantener movimiento
      baseVy,
      tx: 0, // Traducción por mouse
      ty: 0,
      radius: type === "node" ? CONFIG.nodeRadius : CONFIG.dotRadius,
      alpha: 0, // Fade in progresivo
      targetAlpha:
        type === "node"
          ? Math.random() * 0.4 + 0.5 // Nodos: 0.5-0.9 (más visibles)
          : Math.random() * 0.3 + 0.2, // Dots: 0.2-0.5 (más sutiles)
      type,
      magnetism: Math.random() * 3 + 1, // 1-4 (varía sensibilidad al mouse)
      pulsePhase: Math.random() * Math.PI * 2, // Fase aleatoria de pulsación
      mass: type === "node" ? CONFIG.nodeMass : CONFIG.dotMass, // Nodos más pesados
      trail: [], // Trail vacío al inicio
    };
  };

  /**
   * Inicializa el array de partículas según quantity
   * Distribución: 20% nodos, 80% dots
   */
  const initParticles = () => {
    particlesRef.current = [];

    const nodeCount = Math.floor(quantity * CONFIG.nodeRatio);
    const dotCount = quantity - nodeCount;

    // Crear nodos (partículas grandes con conexiones)
    for (let i = 0; i < nodeCount; i++) {
      particlesRef.current.push(createParticle("node"));
    }

    // Crear dots (partículas pequeñas decorativas)
    for (let i = 0; i < dotCount; i++) {
      particlesRef.current.push(createParticle("dot"));
    }
  };

  /**
   * Crea un hexágono estructural reactivo
   * Ahora incluye translación y rotación dinámica afectada por mouse
   */
  const createHexagon = (): Hexagon => {
    const { w, h } = canvasSizeRef.current;

    return {
      x: Math.random() * w,
      y: Math.random() * h,
      tx: 0, // Translación temporal por mouse
      ty: 0,
      size: CONFIG.hexagonSize * (0.7 + Math.random() * 0.6), // ±30% variación
      rotation: Math.random() * Math.PI * 2,
      baseRotationSpeed:
        CONFIG.hexagonRotationSpeed * (Math.random() > 0.5 ? 1 : -1),
      currentRotationSpeed: CONFIG.hexagonRotationSpeed,
    };
  };

  /**
   * Inicializa hexágonos estructurales
   * Cantidad fija (no escala con quantity)
   */
  const initHexagons = () => {
    hexagonsRef.current = [];

    for (let i = 0; i < CONFIG.hexagonCount; i++) {
      hexagonsRef.current.push(createHexagon());
    }
  };

  // =========================================================================
  // FÍSICA Y ACTUALIZACIÓN DE ESTADO
  // =========================================================================

  /**
   * Actualiza física de partículas (física avanzada + movimiento browniano)
   * Se ejecuta cada frame ANTES de dibujar
   *
   * FÍSICA IMPLEMENTADA:
   * 0. Movimiento browniano base (SIEMPRE activo, sin interacción)
   * 1. Empujón del mouse con fuerza inversamente proporcional a la distancia
   * 2. Masa variable (nodos grandes = más masa → menos afectados)
   * 3. Fricción para desaceleración natural
   * 4. Límite de velocidad máxima (evita que se disparen al infinito)
   * 5. Gravedad sutil hacia el centro (evita acumulación en bordes)
   * 6. Rebote en bordes con pérdida de energía (rebote inelástico)
   * 7. Trail visual cuando se mueven rápido
   */
  const updateParticles = () => {
    const { w, h } = canvasSizeRef.current;
    const { x: mx, y: my, radius: mRadius } = mouseRef.current;

    // Centro del canvas (para gravedad sutil)
    const centerX = w / 2;
    const centerY = h / 2;

    particlesRef.current.forEach((p) => {
      // ====================================================================
      // 0. MOVIMIENTO BROWNIANO BASE (mantiene partículas en movimiento)
      // ====================================================================
      // Este movimiento SIEMPRE está activo, incluso sin interacción del mouse
      // Es la velocidad base que hace que las partículas "floten"
      p.vx = p.baseVx;
      p.vy = p.baseVy;

      // Pequeñas variaciones aleatorias en la velocidad base (deriva)
      // Esto evita que las partículas se muevan en línea recta perfecta
      p.baseVx += (Math.random() - 0.5) * 0.01;
      p.baseVy += (Math.random() - 0.5) * 0.01;

      // Limitar la deriva para que no se acumule
      const baseSpeed = p.type === "node" ? CONFIG.nodeSpeed : CONFIG.dotSpeed;
      const currentBaseSpeed = Math.sqrt(
        p.baseVx * p.baseVx + p.baseVy * p.baseVy,
      );
      if (currentBaseSpeed > baseSpeed * 1.5) {
        p.baseVx = (p.baseVx / currentBaseSpeed) * baseSpeed;
        p.baseVy = (p.baseVy / currentBaseSpeed) * baseSpeed;
      }

      // ====================================================================
      // 1. FÍSICA DEL MOUSE: Empujón con fuerza inversamente proporcional
      // ====================================================================
      const dx = p.x - mx;
      const dy = p.y - my;
      const distToMouse = Math.sqrt(dx * dx + dy * dy);

      if (distToMouse < mRadius) {
        // Fuerza inversamente proporcional: más cerca = más empujón
        // Fórmula: F = (1 - d/r) * strength / mass
        const force =
          ((1 - distToMouse / mRadius) * CONFIG.mousePushStrength) / p.mass;

        // Normalizar dirección (vector unitario)
        const angle = Math.atan2(dy, dx);

        // Aplicar fuerza a la velocidad (aceleración)
        // F = m*a → a = F/m (ya dividimos por masa arriba)
        p.vx += Math.cos(angle) * force;
        p.vy += Math.sin(angle) * force;

        // Feedback visual: Flash cuando se empuja con fuerza > threshold
        if (force > CONFIG.pushFlashThreshold / p.mass) {
          p.targetAlpha = Math.min(1, p.targetAlpha + 0.2);
          p.pulsePhase += 0.1; // Pulsar más rápido
        }
      }

      // ====================================================================
      // 2. GRAVEDAD SUTIL HACIA EL CENTRO (evita acumulación en bordes)
      // ====================================================================
      // Fuerza débil que empuja las partículas hacia el centro
      // Esto balancea el empujón del mouse para que no todas terminen en bordes
      const dxCenter = centerX - p.x;
      const dyCenter = centerY - p.y;
      const distToCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

      // Solo aplicar si está lejos del centro (radio > 30% del canvas)
      const centerDeadZone = Math.min(w, h) * 0.3;
      if (distToCenter > centerDeadZone) {
        const gravityForce =
          ((distToCenter - centerDeadZone) / distToCenter) *
          CONFIG.centerGravityStrength;
        const angleToCenter = Math.atan2(dyCenter, dxCenter);

        p.vx += Math.cos(angleToCenter) * gravityForce;
        p.vy += Math.sin(angleToCenter) * gravityForce;
      }

      // ====================================================================
      // 3. LIMITAR VELOCIDAD MÁXIMA (evita que se disparen al infinito)
      // ====================================================================
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > CONFIG.maxParticleSpeed) {
        // Normalizar velocidad al máximo permitido
        p.vx = (p.vx / speed) * CONFIG.maxParticleSpeed;
        p.vy = (p.vy / speed) * CONFIG.maxParticleSpeed;
      }

      // ====================================================================
      // 4. APLICAR FRICCIÓN (desaceleración gradual del empujón)
      // ====================================================================
      // IMPORTANTE: Solo aplicamos fricción al EXCESO de velocidad
      // (velocidad total - velocidad base)
      // Esto permite que el movimiento browniano base NO se frene
      const excessVx = p.vx - p.baseVx;
      const excessVy = p.vy - p.baseVy;

      // Aplicar fricción solo al exceso
      const frictionedExcessVx = excessVx * CONFIG.friction;
      const frictionedExcessVy = excessVy * CONFIG.friction;

      // Sumar de vuelta la velocidad base
      p.vx = p.baseVx + frictionedExcessVx;
      p.vy = p.baseVy + frictionedExcessVy;

      // ====================================================================
      // 5. TRAIL VISUAL (cuando se mueve rápido)
      // ====================================================================
      if (CONFIG.enableTrail && speed > CONFIG.trailMinSpeed) {
        // Agregar punto actual al trail
        p.trail.push({ x: p.x, y: p.y, alpha: 1 });

        // Limitar longitud del trail
        if (p.trail.length > CONFIG.trailLength) {
          p.trail.shift();
        }
      }

      // Decay del trail (fade out gradual)
      p.trail.forEach((point) => {
        point.alpha *= 0.9; // Decay rápido
      });

      // Limpiar puntos del trail con alpha muy bajo
      p.trail = p.trail.filter((point) => point.alpha > 0.05);

      // ====================================================================
      // 6. ACTUALIZAR POSICIÓN
      // ====================================================================
      p.x += p.vx;
      p.y += p.vy;

      // ====================================================================
      // 7. REBOTE EN BORDES (rebote inelástico)
      // ====================================================================
      // En lugar de wrapping (reaparecer del otro lado), ahora rebotan
      const padding = 20; // Espacio de rebote

      if (p.x < padding || p.x > w - padding) {
        // Invertir velocidad X y reducir (pérdida de energía)
        p.vx *= -0.7; // Factor 0.7 = rebote inelástico (pierde 30% de energía)
        p.baseVx *= -0.7; // También invertir la velocidad base
        // Forzar dentro del canvas
        p.x = Math.max(padding, Math.min(w - padding, p.x));
      }

      if (p.y < padding || p.y > h - padding) {
        // Invertir velocidad Y y reducir
        p.vy *= -0.7;
        p.baseVy *= -0.7; // También invertir la velocidad base
        p.y = Math.max(padding, Math.min(h - padding, p.y));
      }

      // ====================================================================
      // 8. REPULSIÓN SUAVE (legacy, para compatibilidad con props staticity/ease)
      // ====================================================================
      // Este efecto crea una "zona de exclusión" alrededor del mouse
      // No afecta la velocidad, solo desplaza visualmente (tx, ty)
      if (distToMouse < mRadius) {
        const force = (mRadius - distToMouse) / mRadius;
        const angle = Math.atan2(dy, dx);

        const targetTx = Math.cos(angle) * force * (staticity / p.magnetism);
        const targetTy = Math.sin(angle) * force * (staticity / p.magnetism);

        // Suavizar el movimiento (easing)
        p.tx += (targetTx - p.tx) / ease;
        p.ty += (targetTy - p.ty) / ease;
      } else {
        // Si está lejos del mouse, volver gradualmente a la posición original
        p.tx *= 0.95;
        p.ty *= 0.95;
      }

      // ====================================================================
      // 9. ANIMACIONES VISUALES
      // ====================================================================
      // Fade in progresivo (evita que aparezcan de golpe)
      p.alpha += (p.targetAlpha - p.alpha) * 0.1;

      // Decay del flash (vuelve a alpha original)
      p.targetAlpha = Math.max(
        p.targetAlpha * 0.95,
        p.type === "node" ? 0.8 : 0.4,
      );

      // Pulsación de nodos (solo nodos, NO dots)
      if (p.type === "node") {
        p.pulsePhase += CONFIG.pulseSpeed;
      }
    });
  };

  /**
   * Actualiza hexágonos reactivos al mouse
   * NUEVO: Hexágonos se mueven y rotan dinámicamente cerca del mouse
   *
   * FÍSICA:
   * - Translación suave cuando el mouse está cerca
   * - Rotación acelerada temporalmente
   * - Vuelven a su posición/rotación original con easing
   */
  const updateHexagons = () => {
    const { x: mx, y: my } = mouseRef.current;

    hexagonsRef.current.forEach((hex) => {
      // Calcular distancia al mouse
      const dx = hex.x - mx;
      const dy = hex.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Radio de influencia (1.5x el radio de las partículas)
      const influenceRadius = CONFIG.mouseRadius * 1.5;

      // Si el mouse está cerca, empujar ligeramente
      if (dist < influenceRadius) {
        const force = (1 - dist / influenceRadius) * CONFIG.hexagonMousePush;
        const angle = Math.atan2(dy, dx);

        // Translación suave (no tan agresiva como partículas)
        const targetTx = Math.cos(angle) * force * 30;
        const targetTy = Math.sin(angle) * force * 30;

        // Easing suave (10% de interpolación por frame)
        hex.tx += (targetTx - hex.tx) * 0.1;
        hex.ty += (targetTy - hex.ty) * 0.1;

        // Acelerar rotación (multiplicador según fuerza)
        hex.currentRotationSpeed =
          hex.baseRotationSpeed * (1 + force * CONFIG.hexagonRotationBoost);
      } else {
        // Volver a posición original (decay suave)
        hex.tx *= 0.95;
        hex.ty *= 0.95;

        // Volver a velocidad de rotación base
        hex.currentRotationSpeed = hex.baseRotationSpeed;
      }

      // Aplicar rotación
      hex.rotation += hex.currentRotationSpeed;
    });
  };

  // =========================================================================
  // RENDERIZADO
  // =========================================================================

  /**
   * Dibuja hexágonos estructurales en el fondo
   * MEJORADO: Ahora se renderizan en (x + tx, y + ty) con translación reactiva
   * Se renderiza PRIMERO (capa más alejada)
   */
  const drawHexagons = () => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const colors = colorsRef.current;

    hexagonsRef.current.forEach((hex) => {
      ctx.save();

      // Aplicar translación temporal por mouse
      ctx.translate(hex.x + hex.tx, hex.y + hex.ty);
      ctx.rotate(hex.rotation);

      // Dibujar hexágono (6 lados)
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = Math.cos(angle) * hex.size;
        const y = Math.sin(angle) * hex.size;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();

      // Relleno ultra sutil
      ctx.fillStyle = colors.hexagon;
      ctx.fill();

      // Borde visible
      ctx.strokeStyle = colors.hexagonStroke;
      ctx.lineWidth = colors.hexagonStrokeWidth;
      ctx.stroke();

      ctx.restore();
    });
  };

  /**
   * Dibuja conexiones entre partículas cercanas
   * MEJORADO: Grosor de línea variable según distancia
   * Optimizado con spatial hashing: O(n*k) en lugar de O(n²)
   *
   * Por qué esto importa:
   * - Sin optimización: 150 partículas = 11,250 comparaciones por frame (150²/2)
   * - Con spatial grid: 150 partículas = ~450 comparaciones (150 * 3 vecinos promedio)
   * - Ganancia: ~25x menos comparaciones = más FPS
   *
   * NUEVO: Grosor de línea dinámico (0.5px lejos → 2px cerca)
   */
  const drawConnections = () => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const colors = colorsRef.current;

    const { x: mx, y: my } = mouseRef.current;
    const maxDist = CONFIG.connectionDistance;

    // Solo dibujamos conexiones entre NODOS (no dots)
    const nodes: Particle[] = particlesRef.current.filter(
      (p) => p.type === "node",
    );

    // Actualizar spatial grid antes de buscar vecinos
    updateSpatialGrid();

    // Dibujar conexiones entre nodos
    nodes.forEach((p1) => {
      const x1 = p1.x + p1.tx;
      const y1 = p1.y + p1.ty;

      // Obtener vecinos del spatial grid (solo revisar celdas cercanas)
      const neighborCells = getNeighborCells(x1, y1);

      neighborCells.forEach((cell) => {
        cell.particles.forEach((p2) => {
          // Evitar duplicados y solo conectar nodos
          if (p2.type !== "node" || p1 === p2) return;

          const x2 = p2.x + p2.tx;
          const y2 = p2.y + p2.ty;

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            // Calcular opacidad según distancia (más cerca = más visible)
            const alpha = 1 - dist / maxDist;

            // NUEVO: Grosor de línea variable según distancia
            // Distancia 0px → Grosor 2px
            // Distancia 150px → Grosor 0.5px
            const lineWidth =
              CONFIG.connectionWidthMin +
              (CONFIG.connectionWidthMax - CONFIG.connectionWidthMin) *
                (1 - dist / maxDist);

            // Si el mouse está cerca de alguno de los nodos, usar color naranja
            const distToMouse1 = Math.sqrt((x1 - mx) ** 2 + (y1 - my) ** 2);
            const distToMouse2 = Math.sqrt((x2 - mx) ** 2 + (y2 - my) ** 2);
            const nearMouse =
              distToMouse1 < CONFIG.mouseConnectionDist ||
              distToMouse2 < CONFIG.mouseConnectionDist;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = nearMouse
              ? colors.connectionActive
              : colors.connection;
            ctx.globalAlpha = alpha * 0.6;
            ctx.lineWidth = lineWidth; // ANTES era constante
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });
      });
    });

    // Conexión temporal mouse → nodo más cercano
    let closestNode: Particle | undefined = undefined;
    let closestDist: number = CONFIG.mouseConnectionDist;

    nodes.forEach((p: Particle) => {
      const x = p.x + p.tx;
      const y = p.y + p.ty;
      const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);

      if (dist < closestDist) {
        closestDist = dist;
        closestNode = p as Particle; // Type assertion para evitar bug de TypeScript narrowing
      }
    });

    if (closestNode !== undefined) {
      // Type assertion para evitar bug de TypeScript narrowing con filter + forEach
      const node: Particle = closestNode as Particle;
      const x = node.x + node.tx;
      const y = node.y + node.ty;
      const alpha = 1 - closestDist / CONFIG.mouseConnectionDist;

      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(x, y);
      ctx.strokeStyle = colors.primary;
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };

  /**
   * Dibuja partículas individuales (nodos + dots) con trail visual
   * Se renderiza ÚLTIMO (capa más cercana)
   */
  const drawParticles = () => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const colors = colorsRef.current;

    particlesRef.current.forEach((p) => {
      // ====================================================================
      // 1. TRAIL VISUAL (estela cuando se mueve rápido)
      // ====================================================================
      if (CONFIG.enableTrail && p.trail.length > 1) {
        ctx.save();

        // Dibujar trail como línea con gradiente de opacidad
        for (let i = 0; i < p.trail.length - 1; i++) {
          const point1 = p.trail[i];
          const point2 = p.trail[i + 1];

          // Opacidad decreciente (más viejo = más transparente)
          const trailAlpha = point1.alpha * p.alpha * 0.3;

          ctx.beginPath();
          ctx.moveTo(point1.x, point1.y);
          ctx.lineTo(point2.x, point2.y);
          ctx.strokeStyle =
            p.type === "node" ? colors.primary : colors.connection;
          ctx.globalAlpha = trailAlpha;
          ctx.lineWidth = p.radius * 0.5; // Grosor proporcional al radio
          ctx.stroke();
        }

        ctx.restore();
      }

      // ====================================================================
      // 2. PARTÍCULA PRINCIPAL
      // ====================================================================
      const x = p.x + p.tx;
      const y = p.y + p.ty;

      // Calcular radio con pulsación (solo nodos)
      let radius = p.radius;
      if (p.type === "node") {
        const pulse = Math.sin(p.pulsePhase) * CONFIG.pulseAmplitude;
        radius = p.radius * (1 + pulse);
      }

      ctx.save();

      // Glow effect (solo en nodos)
      if (p.type === "node") {
        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.primaryGlow;
      }

      // Círculo
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = p.type === "node" ? colors.primary : colors.node;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      ctx.restore();
    });
  };

  /**
   * Loop principal de animación
   * Orden de renderizado (painter's algorithm):
   * 1. Clear canvas
   * 2. Hexágonos (fondo)
   * 3. Conexiones (medio)
   * 4. Partículas (frente)
   */
  const animate = () => {
    const ctx = contextRef.current;
    if (!ctx) return;

    const { w, h } = canvasSizeRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Actualizar estado
    updateParticles();
    updateHexagons();

    // Renderizar capas
    drawHexagons();
    drawConnections();
    drawParticles();

    // Continuar loop
    rafIdRef.current = window.requestAnimationFrame(animate);
  };

  // =========================================================================
  // SETUP Y HANDLERS
  // =========================================================================

  /**
   * Ajusta el tamaño del canvas al contenedor
   * Se ejecuta en mount y en window resize
   */
  const resizeCanvas = () => {
    if (
      !canvasContainerRef.current ||
      !canvasRef.current ||
      !contextRef.current
    ) {
      return;
    }

    const { offsetWidth, offsetHeight } = canvasContainerRef.current;

    canvasSizeRef.current = {
      w: offsetWidth,
      h: offsetHeight,
    };

    // Configurar canvas para retina displays
    canvasRef.current.width = offsetWidth * dpr;
    canvasRef.current.height = offsetHeight * dpr;
    canvasRef.current.style.width = `${offsetWidth}px`;
    canvasRef.current.style.height = `${offsetHeight}px`;

    contextRef.current.setTransform(1, 0, 0, 1, 0, 0);
    contextRef.current.scale(dpr, dpr);

    // Reinicializar entidades con nuevas dimensiones
    initParticles();
    initHexagons();
  };

  /**
   * Handler de movimiento del mouse
   * Actualiza coordenadas relativas al centro del canvas
   */
  const handleMouseMove = (e: MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const { w, h } = canvasSizeRef.current;

    // Coordenadas relativas al centro del canvas
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Verificar que el mouse está dentro del canvas
    const inside = x >= 0 && x <= w && y >= 0 && y <= h;

    if (inside) {
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    }
  };

  // =========================================================================
  // EFECTOS (Lifecycle)
  // =========================================================================

  useEffect(() => {
    const resolveTheme = () => {
      if (typeof document === "undefined") return;
      const isDark = document.documentElement.classList.contains("dark");

      const brand = readCssVar("--action-main", COLOR_FALLBACKS.brand);
      const textHint = readCssVar("--text-hint", COLOR_FALLBACKS.textHint);
      const textMuted = readCssVar("--text-muted", COLOR_FALLBACKS.textMuted);
      const borderStruct = readCssVar(
        "--border-struct",
        COLOR_FALLBACKS.borderStruct,
      );

      colorsRef.current = {
        primary: toRgba(brand, 0.8),
        primaryGlow: toRgba(brand, 0.3),
        node: toRgba(textHint, 0.6),
        nodeGlow: toRgba(textHint, 0.2),
        connection: toRgba(textMuted, isDark ? 0.15 : 0.22),
        connectionActive: toRgba(brand, 0.4),
        hexagon: isDark ? toRgba(textHint, 0.03) : toRgba(textMuted, 0.12),
        hexagonStroke: isDark
          ? toRgba(borderStruct, 0.12)
          : toRgba(textMuted, 0.3),
        hexagonStrokeWidth: isDark ? 1 : 1.25,
      };
    };

    // Inicializar contexto de canvas
    if (canvasRef.current) {
      contextRef.current = canvasRef.current.getContext("2d");
    }

    resolveTheme();

    // Setup inicial
    resizeCanvas();

    // Event listeners
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", handleMouseMove);

    const observer = new MutationObserver(() => resolveTheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery =
      typeof window !== "undefined"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : undefined;
    const handleMediaChange = () => resolveTheme();
    mediaQuery?.addEventListener("change", handleMediaChange);

    // Iniciar loop de animación
    rafIdRef.current = window.requestAnimationFrame(animate);

    // Cleanup (CRÍTICO para evitar memory leaks)
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);

      observer.disconnect();
      mediaQuery?.removeEventListener("change", handleMediaChange);

      if (rafIdRef.current) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, staticity, ease]); // Re-inicializar si cambian props

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none ${className}`}
      ref={canvasContainerRef}
      aria-label="Fondo animado de partículas con temática clínica y científica"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ willChange: "contents" }} // Hint al navegador para optimizar
      />
    </div>
  );
};
