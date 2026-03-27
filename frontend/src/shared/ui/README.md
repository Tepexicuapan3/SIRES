# UI Primitives (shadcn + SIRES)

Esta carpeta contiene componentes primitivos reutilizables para toda la app.

## Reglas Base

- Usar tokens semanticos de `frontend/src/shared/styles/theme.css`.
- No hardcodear colores (`#hex`, `bg-orange-500`, etc.).
- Mantener accesibilidad (aria, focus states, keyboard nav).
- Componentes de feature no viven aca; van en `frontend/src/features/<feature>/components/`.

## Instalacion de componentes shadcn

```bash
cd frontend
bunx --bun shadcn@latest add button
```

Luego adaptar estilos a tokens del sistema SIRES.

## Estructura Tipica

```txt
shared/ui/
├── button.tsx
├── input.tsx
├── dialog.tsx
├── select.tsx
├── table.tsx
├── tooltip.tsx
└── ...
```

## Ejemplo de Uso

```tsx
import { Button } from "@shared/ui/button";

export function SaveAction() {
  return <Button variant="default">Guardar</Button>;
}
```

## Referencias

- Guia UI del proyecto: `docs/guides/ui-components.md`
- Reglas de agente para componentes: `frontend/src/components/AGENTS.md`
- Documentacion shadcn: https://ui.shadcn.com
