# API Docs - SIRES

Esta carpeta centraliza la documentacion del contrato de API esperado por el frontend.

Fuente de verdad
- `docs/api/standards.md` define los estandares globales.
- Si hay conflicto con el backend actual, se sigue lo definido en este documento.

Estructura
- `standards.md` estandares globales.
- `modules/auth.md` contratos de autenticacion.
- `modules/rbac.md` contratos de roles, permisos y overrides.

Reglas de mantenimiento
- Actualiza primero `docs/api/standards.md` y despues los modulos.
- Los modulos deben reflejar `frontend/src/api/resources/` y `frontend/src/api/types/`.
- No dupliques estandares en `frontend/src/api/` salvo enlaces.
