# Templates de Documentacion

Plantillas para mantener consistencia en la documentacion de SIRES.

## Templates Disponibles

### `guide-template.md`

Usar para guias de implementacion y procedimientos repetibles.

- Destino sugerido: `docs/guides/<tema>.md`
- Ideal para: onboarding tecnico, pasos de implementacion, checklists

### `adr-template.md`

Usar para decisiones arquitectonicas relevantes.

- Destino sugerido: `docs/adr/###-titulo.md`
- Ideal para: decisiones con tradeoffs, cambios de arquitectura, politicas tecnicas

## Flujo Recomendado

1. Copiar template.
2. Reemplazar placeholders.
3. Ajustar secciones al alcance real (quitar lo que no aplique).
4. Validar calidad.
5. Agregar enlace en `docs/README.md`.

## Checklist de Calidad

- [ ] El documento esta en la carpeta correcta.
- [ ] No duplica contenido existente.
- [ ] Tiene ejemplos ejecutables/copy-paste.
- [ ] Explica limites, supuestos y tradeoffs (si aplica).
- [ ] Esta enlazado desde `docs/README.md`.

## Cuando NO crear un doc nuevo

- Cuando solo es debugging temporal.
- Cuando el cambio no altera contratos ni decisiones.
- Cuando ya existe una guia equivalente que solo necesita una actualizacion menor.

## Convenciones

- Mantener archivos enfocados y legibles.
- Preferir tablas y checklists para guias operativas.
- En ADRs: registrar alternativas descartadas y consecuencias.

## Referencias

- Indice de docs: `docs/README.md`
- Reglas de docs para agentes: `docs/AGENTS.md`
- Reglas de contratos API: `docs/api/AGENTS.md`
