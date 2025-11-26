import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
  inHexagon: boolean;
  targetIndex?: number;
  hexagonId?: string;
}

export const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Configuración
    const particleCount = 220;
    const connectionDistance = 80;
    const hexagonFormDistance = 60;
    const mouseRepelRadius = 150;

    // Crear partículas iniciales con variedad
    for (let i = 0; i < particleCount; i++) {
      const size = Math.random();
      const speedMultiplier = 1 - size * 0.5; // Más grandes = más lentas

      particlesRef.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5 * speedMultiplier,
        vy: (Math.random() - 0.5) * 1.5 * speedMultiplier,
        radius: 1.5 + size * 2.5, // Variedad de tamaños: 1.5 a 4
        connections: [],
        inHexagon: false,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const getColors = () => {
      const isDark = document.documentElement.classList.contains("dark");
      return {
        background: isDark ? "#000000" : "#f8f9fa",
        particle: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(50, 50, 50, 0.8)",
        connection: isDark
          ? "rgba(200, 200, 200, 0.3)"
          : "rgba(100, 100, 100, 0.25)",
        hexagon: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(80, 80, 80, 0.4)",
        glow: isDark ? "rgba(204, 82, 0, 0.3)" : "rgba(255, 133, 51, 0.25)",
        glowNearMouse: isDark
          ? "rgba(204, 82, 0, 0.5)"
          : "rgba(255, 133, 51, 0.4)",
      };
    };

    // Detectar y formar hexágonos
    const detectHexagons = () => {
      const particles = particlesRef.current;

      particles.forEach((p) => {
        p.connections = [];
        p.inHexagon = false;
      });

      // Crear conexiones entre partículas cercanas
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < hexagonFormDistance) {
            p1.connections.push(j);
            p2.connections.push(i);
          }
        }
      }

      // Marcar partículas que forman hexágonos (6 conexiones)
      particles.forEach((p) => {
        if (p.connections.length >= 5) {
          p.inHexagon = true;
        }
      });
    };

    // Fuerza de cohesión para mantener hexágonos
    const applyHexagonForces = () => {
      const particles = particlesRef.current;

      particles.forEach((p) => {
        if (p.connections.length > 0) {
          let avgX = 0,
            avgY = 0;
          let count = 0;

          p.connections.forEach((idx) => {
            const other = particles[idx];
            const dx = other.x - p.x;
            const dy = other.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0 && dist < hexagonFormDistance * 1.5) {
              avgX += other.x;
              avgY += other.y;
              count++;

              // Fuerza de cohesión
              const targetDist = hexagonFormDistance * 0.8;
              const force = (dist - targetDist) * 0.02;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          });

          // Tender hacia el centro del grupo
          if (count > 0) {
            avgX /= count;
            avgY /= count;
            const toCenterX = avgX - p.x;
            const toCenterY = avgY - p.y;
            p.vx += toCenterX * 0.01;
            p.vy += toCenterY * 0.01;
          }
        }
      });
    };

    const animate = () => {
      const colors = getColors();
      const mouse = mouseRef.current;

      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Detectar formaciones de hexágonos
      detectHexagons();
      applyHexagonForces();

      // Actualizar partículas
      particles.forEach((particle) => {
        // Movimiento básico con variación
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Fricción variable según tamaño
        const friction = 0.97 + particle.radius / 100;
        particle.vx *= friction;
        particle.vy *= friction;

        // Rebotar en bordes
        const margin = 20;
        if (particle.x < margin) {
          particle.x = margin;
          particle.vx *= -0.8;
        }
        if (particle.x > canvas.width - margin) {
          particle.x = canvas.width - margin;
          particle.vx *= -0.8;
        }
        if (particle.y < margin) {
          particle.y = margin;
          particle.vy *= -0.8;
        }
        if (particle.y > canvas.height - margin) {
          particle.y = canvas.height - margin;
          particle.vy *= -0.8;
        }

        // Repulsión del mouse (más fuerte para partículas grandes)
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouseRepelRadius && dist > 0) {
          const force = (mouseRepelRadius - dist) / mouseRepelRadius;
          const strength = (particle.inHexagon ? 3 : 2) * (particle.radius / 2);
          particle.vx += (dx / dist) * force * strength;
          particle.vy += (dy / dist) * force * strength;
        }

        // Movimiento flotante aleatorio (más errático para partículas pequeñas)
        if (!particle.inHexagon) {
          const randomStrength = (4 - particle.radius) * 0.05;
          particle.vx += (Math.random() - 0.5) * randomStrength;
          particle.vy += (Math.random() - 0.5) * randomStrength;
        }

        // Limitar velocidad según tamaño
        const speed = Math.sqrt(
          particle.vx * particle.vx + particle.vy * particle.vy
        );
        const maxSpeed = particle.inHexagon ? 3 : 6 - particle.radius;
        if (speed > maxSpeed) {
          particle.vx = (particle.vx / speed) * maxSpeed;
          particle.vy = (particle.vy / speed) * maxSpeed;
        }
      });

      // Dibujar conexiones
      const drawnConnections = new Set<string>();
      particles.forEach((p, i) => {
        p.connections.forEach((idx) => {
          const key = i < idx ? `${i}-${idx}` : `${idx}-${i}`;
          if (drawnConnections.has(key)) return;
          drawnConnections.add(key);

          const other = particles[idx];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = 1 - dist / connectionDistance;
            const isHexagonConnection = p.inHexagon && other.inHexagon;

            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);

            if (isHexagonConnection) {
              ctx.strokeStyle = colors.hexagon.replace(
                /[\d.]+\)$/g,
                `${opacity * 0.8})`
              );
              ctx.lineWidth = 2;
            } else {
              ctx.strokeStyle = colors.connection.replace(
                /[\d.]+\)$/g,
                `${opacity * 0.5})`
              );
              ctx.lineWidth = 1;
            }
            ctx.stroke();
          }
        });
      });

      // Dibujar partículas
      particles.forEach((particle) => {
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        const isNearMouse = distToMouse < mouseRepelRadius * 0.7;

        // Partícula principal
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = colors.particle;
        ctx.fill();

        // Glow para partículas en hexágonos
        if (particle.inHexagon) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.radius * 3
          );
          gradient.addColorStop(0, colors.glow);
          gradient.addColorStop(1, "rgba(255, 133, 51, 0)");
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Glow extra cerca del mouse
        if (isNearMouse) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius * 5, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            particle.x,
            particle.y,
            0,
            particle.x,
            particle.y,
            particle.radius * 5
          );
          gradient.addColorStop(
            0,
            colors.hexagon.replace(/[\d.]+\)$/g, "0.4)")
          );
          gradient.addColorStop(0, colors.glowNearMouse);
          gradient.addColorStop(1, "rgba(255, 133, 51, 0)");
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      style={{ background: "transparent" }}
    />
  );
};
