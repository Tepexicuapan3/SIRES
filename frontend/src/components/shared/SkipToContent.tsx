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
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-txt-inverse focus:shadow-lg focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:outline-hidden"
    >
      Saltar al contenido principal
    </a>
  );
}
