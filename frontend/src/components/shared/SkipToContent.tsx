/**
 * SkipToContent.tsx
 *
 * Componente de accesibilidad para navegación por teclado.
 *
 * Provee un link "Skip to main content" que aparece solo cuando
 * recibe focus (Tab desde el inicio de la página).
 *
 * Crítico para usuarios de teclado/screen readers que no quieren
 * navegar por todo el sidebar cada vez.
 *
 * Estándar WCAG 2.1 - Criterio 2.4.1 (Bypass Blocks)
 */

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:border focus:border-line-struct focus:bg-paper focus:px-3 focus:py-1.5 focus:text-xs focus:font-medium focus:text-txt-body focus:shadow-sm focus:ring-4 focus:ring-line-struct/50 focus-visible:outline-none"
    >
      Saltar al contenido principal
    </a>
  );
}
