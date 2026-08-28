import { useEffect, useState } from "react";

import { listarAnunciosVigentes, type Anuncio } from "@/api/anuncios.api";

/**
 * Banner de anuncios/flyers publicados desde SISEM (`sdd/anuncios-portal-citas`).
 *
 * Requisito MUST del spec (`sdd/anuncios-portal-citas/spec`, dominio
 * `comunicados/portal-banner-ui`): lista APILADA, NO carrusel — sin
 * autoplay ni indicadores, por accesibilidad. Pisa lo que decía el design
 * (que sugería un carrusel simple); el spec es la fuente de verdad.
 *
 * Fetch manual con `useEffect` + estado local — el portal NO usa TanStack
 * Query (mismo patrón que el resto de `HomePage.tsx`). Si la carga falla o
 * la lista viene vacía, no se renderiza nada: el banner nunca debe romper
 * el Home (caso límite "cero anuncios" del spec).
 */
export default function AnunciosBanner() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  useEffect(() => {
    let activo = true;
    listarAnunciosVigentes()
      .then((data) => {
        if (activo) setAnuncios(data);
      })
      .catch(() => {
        // No bloqueante: si falla la carga de anuncios, el banner
        // simplemente no se muestra (nunca debe romper el Home).
      });
    return () => {
      activo = false;
    };
  }, []);

  if (anuncios.length === 0) return null;

  return (
    <section aria-label="Anuncios" className="flex flex-col gap-3">
      {anuncios.map((anuncio) => {
        const media = (
          <>
            <img
              src={anuncio.imagenUrl}
              alt={anuncio.titulo}
              loading="lazy"
              className="w-full rounded-xl object-cover"
            />
            <h3 className="text-base font-medium text-txt-body">{anuncio.titulo}</h3>
            {anuncio.descripcion && (
              <p className="text-sm text-txt-muted">{anuncio.descripcion}</p>
            )}
          </>
        );

        return (
          <div
            key={anuncio.id}
            className="flex flex-col gap-2 rounded-2xl border border-line-struct bg-paper/85 p-4 shadow-sm backdrop-blur-md sm:p-6"
          >
            {/* El enlace externo envuelve solo imagen+título+descripción —
                el link "Descargar" queda afuera para no anidar <a>. */}
            {anuncio.enlaceUrl ? (
              <a
                href={anuncio.enlaceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-2"
              >
                {media}
              </a>
            ) : (
              media
            )}
            {anuncio.adjuntoUrl && (
              <a
                href={anuncio.adjuntoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-brand underline"
              >
                Descargar
              </a>
            )}
          </div>
        );
      })}
    </section>
  );
}
