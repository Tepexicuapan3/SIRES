import { useEffect, useRef } from "react";

import type { Anuncio } from "@/api/anuncios.api";

interface AnuncioModalProps {
  anuncios: Anuncio[];
  activeIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  prefersReducedMotion: boolean;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Vista ampliada de un anuncio, con navegación anterior/siguiente sin
 * cerrar el modal. Foco atrapado + Escape + flechas de teclado: es la
 * salvaguarda de accesibilidad que compensa el autoplay del carrusel
 * (ver comentario en `AnunciosBanner.tsx`).
 */
export default function AnuncioModal({
  anuncios,
  activeIndex,
  onClose,
  onNavigate,
  prefersReducedMotion,
}: AnuncioModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const anuncio = anuncios[activeIndex];
  const total = anuncios.length;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && total > 1) {
        onNavigate((activeIndex - 1 + total) % total);
        return;
      }
      if (e.key === "ArrowRight" && total > 1) {
        onNavigate((activeIndex + 1) % total);
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          FOCUSABLE_SELECTOR
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, total]);

  if (!anuncio) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="anuncio-modal-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`flex w-full max-w-2xl flex-col gap-4 rounded-2xl bg-paper p-5 shadow-modal outline-none sm:p-6 ${
          prefersReducedMotion ? "" : "motion-safe:animate-modal-in"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-txt-muted">
            Anuncio {activeIndex + 1} de {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1.5 text-txt-muted hover:bg-subtle hover:text-txt-body"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="size-5"
              aria-hidden="true"
            >
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <img
          src={anuncio.imagenUrl}
          alt={anuncio.titulo}
          className="max-h-[50vh] w-full rounded-xl object-cover"
        />

        <h2
          id="anuncio-modal-titulo"
          className="text-lg font-display font-semibold text-txt-body sm:text-xl"
        >
          {anuncio.titulo}
        </h2>

        {anuncio.descripcion && (
          <p className="whitespace-pre-line text-sm text-txt-muted sm:text-base">
            {anuncio.descripcion}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {anuncio.enlaceUrl && (
            <a
              href={anuncio.enlaceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-txt-inverse hover:bg-brand-hover"
            >
              Visitar enlace
            </a>
          )}
          {anuncio.adjuntoUrl && (
            <a
              href={anuncio.adjuntoUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-line-struct px-4 py-2 text-sm font-medium text-txt-body hover:bg-subtle"
            >
              Descargar adjunto
            </a>
          )}
        </div>

        {total > 1 && (
          <div className="mt-1 flex items-center justify-between border-t border-line-hairline pt-4">
            <button
              type="button"
              onClick={() => onNavigate((activeIndex - 1 + total) % total)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-txt-body hover:bg-subtle"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="size-4"
                aria-hidden="true"
              >
                <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Anterior
            </button>
            <button
              type="button"
              onClick={() => onNavigate((activeIndex + 1) % total)}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-txt-body hover:bg-subtle"
            >
              Siguiente
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="size-4"
                aria-hidden="true"
              >
                <path d="M8 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
