import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";

import type { Anuncio } from "@/api/anuncios.api";
import AnuncioModal from "@/components/AnuncioModal";

const AUTOPLAY_MS = 6000;
const DRAG_THRESHOLD_PX = 5;

interface AnunciosCarouselProps {
  anuncios: Anuncio[];
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}

/**
 * Carrusel horizontal de tarjetas para el banner de anuncios (ver decisión
 * actualizada en `AnunciosBanner.tsx`). Usa scroll nativo con snap en vez de
 * transforms a mano: da soporte táctil y con teclado gratis y sin librerías.
 */
export default function AnunciosCarousel({ anuncios }: AnunciosCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(0);
  const dragState = useRef({ isDown: false, startX: 0, startScroll: 0, moved: false });

  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const total = anuncios.length;

  // Autoplay corre siempre (salvo `prefers-reduced-motion`) y nunca se
  // detiene por interacción del usuario -- pedido explícito: "automático,
  // sin botón". El intervalo es estable, ajeno a re-renders de activeIndex
  // (evita que cada scroll "reinicie" el conteo de 6s).
  useEffect(() => {
    if (prefersReducedMotion || total <= 1) return;
    const id = window.setInterval(() => {
      scrollToIndex((activeIndexRef.current + 1) % total, true);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [total, prefersReducedMotion]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  function scrollToIndex(index: number, smooth: boolean) {
    const container = scrollRef.current;
    if (!container) return;
    const target = container.children[index] as HTMLElement | undefined;
    if (!target) return;
    const left =
      target.offsetLeft - (container.clientWidth - target.offsetWidth) / 2;
    container.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }

  function handleUserNavigate(index: number) {
    scrollToIndex(index, !prefersReducedMotion);
  }

  function handleScroll() {
    const container = scrollRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const scrollCenter = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(childCenter - scrollCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }

  function handleContainerKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handleUserNavigate((activeIndex - 1 + total) % total);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleUserNavigate((activeIndex + 1) % total);
    }
  }

  function handleMouseDown(e: ReactMouseEvent) {
    const container = scrollRef.current;
    if (!container) return;
    dragState.current = {
      isDown: true,
      startX: e.pageX,
      startScroll: container.scrollLeft,
      moved: false,
    };
  }

  function handleMouseMove(e: ReactMouseEvent) {
    if (!dragState.current.isDown) return;
    const container = scrollRef.current;
    if (!container) return;
    const dx = e.pageX - dragState.current.startX;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX) dragState.current.moved = true;
    container.scrollLeft = dragState.current.startScroll - dx;
  }

  function endDrag() {
    dragState.current.isDown = false;
  }

  function handleCardClick(index: number) {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    setModalIndex(index);
  }

  if (total === 0) return null;

  const activeAnuncio = anuncios[activeIndex];

  return (
    <section
      aria-label="Anuncios"
      aria-roledescription="carrusel"
      className="flex flex-col gap-3"
    >
      <div className="relative">
        {total > 1 && (
          <button
            type="button"
            onClick={() => handleUserNavigate((activeIndex - 1 + total) % total)}
            aria-label="Anuncio anterior"
            className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line-struct bg-paper/90 p-2 shadow-soft backdrop-blur-md hover:bg-subtle sm:flex"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="size-4 text-txt-body"
              aria-hidden="true"
            >
              <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        <div
          ref={scrollRef}
          tabIndex={0}
          onScroll={handleScroll}
          onKeyDown={handleContainerKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
          className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto touch-pan-x scroll-smooth px-1 py-2 [scrollbar-width:none] active:cursor-grabbing motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
        >
          {anuncios.map((anuncio, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={anuncio.id}
                type="button"
                onClick={() => handleCardClick(i)}
                aria-roledescription="slide"
                aria-label={`Anuncio ${i + 1} de ${total}: ${anuncio.titulo}`}
                className={`group flex w-[78%] shrink-0 snap-center flex-col gap-2 rounded-2xl border bg-paper p-3 text-left shadow-soft transition-[transform,box-shadow] duration-300 ease-out hover:shadow-modal motion-reduce:transition-none sm:w-[45%] sm:p-4 lg:w-[30%] ${
                  isActive
                    ? "scale-[1.03] border-status-info/40 shadow-modal"
                    : "scale-100 border-line-hairline"
                }`}
              >
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={anuncio.imagenUrl}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-paper/90 text-status-critical shadow-soft backdrop-blur-md"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5">
                      <path d="M10 17.5s-6.5-4.06-6.5-8.6C3.5 5.9 5.5 4 8 4c1.2 0 2.3.6 2.9 1.6.5-.9 1.7-1.6 2.9-1.6 2.5 0 4.5 1.9 4.5 4.9 0 4.54-6.5 8.6-6.5 8.6z" />
                    </svg>
                  </span>
                </div>
                <h3 className="line-clamp-1 text-sm font-medium text-txt-body sm:text-base">
                  {anuncio.titulo}
                </h3>
                {anuncio.descripcion && (
                  <p className="line-clamp-2 text-xs text-txt-muted sm:text-sm">
                    {anuncio.descripcion}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={() => handleUserNavigate((activeIndex + 1) % total)}
            aria-label="Siguiente anuncio"
            className="absolute right-0 top-1/2 z-10 hidden -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-line-struct bg-paper/90 p-2 shadow-soft backdrop-blur-md hover:bg-subtle sm:flex"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="size-4 text-txt-body"
              aria-hidden="true"
            >
              <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {total > 1 && (
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Seleccionar anuncio">
          {anuncios.map((anuncio, i) => (
            <button
              key={anuncio.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Ir al anuncio ${i + 1}`}
              onClick={() => handleUserNavigate(i)}
              className={`h-2 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                i === activeIndex ? "w-5 bg-status-info" : "w-2 bg-line-struct hover:bg-txt-hint"
              }`}
            />
          ))}
        </div>
      )}

      <span className="sr-only" aria-live="polite">
        {activeAnuncio ? `Anuncio ${activeIndex + 1} de ${total}: ${activeAnuncio.titulo}` : ""}
      </span>

      {modalIndex !== null && (
        <AnuncioModal
          anuncios={anuncios}
          activeIndex={modalIndex}
          onClose={() => setModalIndex(null)}
          onNavigate={setModalIndex}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
    </section>
  );
}
