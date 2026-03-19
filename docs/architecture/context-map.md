# Context Map (Bounded Contexts)

> TL;DR: Definimos limites de contexto para trabajar por dominios sin mezclar reglas de negocio.

## Problem / Context

Sin bounded contexts claros, los cambios terminan cruzando modulos, generando deuda y regresiones.

## Solution / Implementation

## Contextos principales

1. **Identity & Access**
   - Login, sesion, permisos, auditoria de acceso.
2. **Atencion Clinica**
   - Recepcion, somatometria, consulta medica.
3. **Catalogos Operativos**
   - Catalogos maestros, opciones y metadatos.
4. **Logistica Clinica**
   - Movimientos, pases y flujo operativo.
5. **Servicios Compartidos**
   - Realtime, infraestructura cross-cutting.

## Relaciones (alto nivel)

- Identity & Access es dependencia transversal para todos.
- Atencion Clinica depende de Catalogos Operativos.
- Logistica Clinica consume datos de Atencion Clinica.
- Servicios Compartidos no debe contener logica de negocio de un dominio.

## Contratos entre contextos

- Integracion via API contracts versionados y eventos/realtime bien definidos.
- Evitar imports directos entre dominios en capa `domain`.
- Si se necesita informacion de otro contexto, usar facade/use_case de borde.

## References

- `docs/architecture/domain-map.md`
- `docs/architecture/dependency-rules.md`
- `docs/templates/rfc-cross-domain-template.md`
