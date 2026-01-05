# ADR-### [Título de la Decisión]

**Estado:** [Propuesto | Aceptado | Deprecado | Reemplazado por ADR-XXX]  
**Fecha:** YYYY-MM-DD  
**Autores:** @usuario / AI Agent  
**Decisores:** @usuario1, @usuario2  

---

## Contexto y Problema

[Describí el contexto técnico/de negocio y el problema que estamos enfrentando]

[Ejemplo: "El sistema actual guarda JWT en localStorage, lo que expone tokens a ataques XSS. Necesitamos un mecanismo de autenticación más seguro sin romper la experiencia de usuario"]

**Factores importantes:**
- [Factor 1: ej. "Seguridad es prioridad máxima"]
- [Factor 2: ej. "No podemos romper la API actual"]
- [Factor 3: ej. "Debe funcionar con CORS"]

---

## Decisión

[Describí la decisión tomada en forma clara y directa]

[Ejemplo: "Vamos a migrar los JWT de localStorage a cookies HttpOnly con protección CSRF mediante double-submit cookie pattern"]

**Implementación clave:**
- [Punto clave 1]
- [Punto clave 2]
- [Punto clave 3]

---

## Alternativas Consideradas

### Opción 1: [Nombre de la alternativa]

**Descripción:**
[Explicá brevemente esta opción]

**Pros:**
- ✅ [Ventaja 1]
- ✅ [Ventaja 2]

**Contras:**
- ❌ [Desventaja 1]
- ❌ [Desventaja 2]

**Por qué la rechazamos:**
[Razón principal]

---

### Opción 2: [Nombre de la alternativa]

**Descripción:**
[Explicá brevemente esta opción]

**Pros:**
- ✅ [Ventaja 1]

**Contras:**
- ❌ [Desventaja 1]

**Por qué la rechazamos:**
[Razón principal]

---

### Opción 3: [Decisión elegida] ⭐

**Descripción:**
[Explicá la opción que elegimos]

**Pros:**
- ✅ [Ventaja 1]
- ✅ [Ventaja 2]
- ✅ [Ventaja 3]

**Contras (trade-offs aceptados):**
- ⚠️ [Trade-off 1]
- ⚠️ [Trade-off 2]

**Por qué la elegimos:**
[Razón principal de la decisión]

---

## Consecuencias

### Positivas

- ✅ **[Beneficio 1]:** [Descripción del impacto positivo]
- ✅ **[Beneficio 2]:** [Descripción]
- ✅ **[Beneficio 3]:** [Descripción]

---

### Negativas (Trade-offs)

- ⚠️ **[Trade-off 1]:** [Descripción del costo/limitación aceptada]
- ⚠️ **[Trade-off 2]:** [Descripción]

**Cómo mitigamos:**
- [Estrategia de mitigación 1]
- [Estrategia de mitigación 2]

---

## Implementación

### Backend

**Archivos afectados:**
```
backend/src/
  __init__.py                           # Configuración JWT
  presentation/api/auth_routes.py       # Endpoints auth
  infrastructure/security/jwt_service.py # Servicio JWT
```

**Ejemplo de código clave:**
```python
# backend/src/__init__.py
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_ACCESS_COOKIE_NAME"] = "access_token"
```

---

### Frontend

**Archivos afectados:**
```
frontend/src/
  api/client.ts                  # Axios interceptors
  store/authStore.ts             # Store de auth
```

**Ejemplo de código clave:**
```typescript
// frontend/src/api/client.ts
const csrfToken = getCookie("csrf_access_token");
if (csrfToken && method !== "GET") {
  config.headers["X-CSRF-TOKEN"] = csrfToken;
}
```

---

### Migración (si aplica)

**Pasos para migración:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Rollback plan:**
[Cómo revertir si algo sale mal]

---

## Validación

**Cómo validar que la decisión funciona:**

- [ ] [Criterio de éxito 1]
- [ ] [Criterio de éxito 2]
- [ ] [Criterio de éxito 3]

**Tests necesarios:**
- [Test 1]
- [Test 2]

---

## Métricas de Éxito

[Cómo medimos si esta decisión fue correcta]

**KPIs:**
- [Métrica 1: ej. "0 vulnerabilidades XSS en auditoría"]
- [Métrica 2: ej. "Tiempo de login <500ms"]

---

## Referencias

### Documentación Interna
- [Guía relacionada](../guides/nombre-guia.md)
- [Otro ADR relacionado](./001-otra-decision.md)

### Documentación Externa
- [Artículo/RFC/Spec relevante](https://url.com)
- [Librería/herramienta oficial docs](https://url.com)

### Issues/PRs Relacionados
- [Issue #123: Problema que motivó esta decisión](https://github.com/...)
- [PR #456: Implementación de esta decisión](https://github.com/...)

---

## Notas Adicionales

[Cualquier contexto extra que sea relevante para entender la decisión]

[Ejemplo: "Esta decisión fue discutida en la sesión de arquitectura del 2024-01-15. Ver notas en..."]

---

## Histórico de Cambios

- **YYYY-MM-DD:** Decisión propuesta por @usuario
- **YYYY-MM-DD:** Aceptada después de review
- **YYYY-MM-DD:** Implementada en producción
