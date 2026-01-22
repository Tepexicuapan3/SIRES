# Guia de Auth Queries y Mutations

> **TL;DR:** Esta guia explica como funciona la capa de autenticacion basada en TanStack Query, sus hooks de lectura/escritura y la sincronizacion con el store.

**Fecha creacion:** 2026-01-22  
**Ultima actualizacion:** 2026-01-22  
**Autor:** AI Agent

---

## Contexto y Problema

La autenticacion necesita una fuente unica de verdad para el usuario, permisos y estado de sesion. Sin una capa consistente, cada componente termina leyendo datos distintos y la UI pierde coherencia.

---

## Prerequisitos

- [ ] Conocer los contratos en `docs/api/standards.md`
- [ ] Conocer los tipos en `frontend/src/api/types/auth.types.ts`
- [ ] Haber revisado el API layer en `frontend/src/api/resources/auth.api.ts`

**Referencias:**
- [API Auth](../api/modules/auth.md)
- [Authentication Architecture](../architecture/authentication.md)

---

## Estructura y Responsabilidades

```
frontend/src/features/auth/
  queries/
    auth.keys.ts
    useAuthSession.ts
    usePermissions.ts
  mutations/
    useLogin.ts
    useLogout.ts
    useRefreshSession.ts
  utils/
    auth-cache.ts
    errorMessages.ts
```

### Queries (lectura)
- `auth.keys.ts`: define keys unificadas para cache de sesion.
- `useAuthSession.ts`: obtiene `/auth/me` y sincroniza cache + store.
- `usePermissions.ts`: expone helpers RBAC basados en la sesion cacheada.

### Mutations (escritura)
- `useLogin.ts`: ejecuta login, setea sesion y navega segun onboarding/landing.
- `useLogout.ts`: limpia cache y store de forma segura y redirige.
- `useRefreshSession.ts`: invalida la sesion para re-hidratar.

### Utils
- `auth-cache.ts`: puente entre React Query y el store de auth.
- `errorMessages.ts`: filtros de mensajes por flujo basados en errores globales.

---

## Paso a Paso

### 1. Lectura de sesion

`useAuthSession` consulta `/auth/me` y sincroniza los datos en cache y store.

**Por que es importante:**
- Evita doble fuente de verdad.
- Permite que permisos y guards lean la misma sesion.

---

### 2. Permisos unificados

`usePermissions` consume la sesion cacheada y expone `hasPermission`, `hasAnyPermission`, `hasAllPermissions` e `isAdmin`.

**Por que es importante:**
- La logica RBAC no se duplica en componentes.
- Los cambios de permisos se aplican globalmente al invalidar la sesion.

---

### 3. Login y onboarding

`useLogin` inicia sesion y decide el flujo:
- Si `requiresOnboarding` -> redirige a onboarding.
- Si no -> usa `landingRoute` o `/dashboard`.

**Por que es importante:**
- Centraliza el comportamiento post-login.
- Evita redirecciones inconsistentes por componente.

---

### 4. Logout consistente

`useLogout` limpia cache, store y navegacion en un solo punto.

**Por que es importante:**
- Evita que datos sensibles queden en cache.
- Previene acceso visual despues de logout.

---

## Checklist Final

- [ ] `auth.keys.ts` es la unica fuente de keys
- [ ] `useAuthSession` es la unica fuente de usuario autenticado
- [ ] `usePermissions` se usa en UI en lugar de logica ad-hoc
- [ ] `auth-cache.ts` es el unico puente cache <-> store
- [ ] Mensajes provienen de `errorMessages.ts`

---

## Referencias

- [API Auth](../api/modules/auth.md)
- [Authentication Architecture](../architecture/authentication.md)
- [API Standards](../api/standards.md)
