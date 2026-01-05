# ADR 002: Wizard de Onboarding (2 Pasos)

**Status:** Aceptado  
**Fecha:** Diciembre 2025  
**Contexto:** Primer login de usuarios nuevos en SIRES

---

## Contexto y Problema

Los usuarios nuevos necesitan:
1. Aceptar términos y condiciones (legal)
2. Cambiar contraseña temporal (seguridad)

**Opciones consideradas:**
1. Single-step form (todo en una página)
2. Wizard de 2 pasos (términos → password)
3. Wizard de 3 pasos (términos → password → perfil)

---

## Decisión

Wizard de **2 pasos** con patrón orchestrator/sub-forms.

---

## Arquitectura

### Estructura de Componentes

```
OnboardingPage.tsx (orchestrator)
├── state: currentStep = 1 | 2
├── mutation: completeOnboarding
└── renderiza según step:
    ├── Step 1: TermsStep.tsx
    └── Step 2: AuthPasswordForm.tsx (mode="onboarding")
```

### Flujo

```
LOGIN (usuario nuevo) → must_change_password=true
    ↓
PASO 1: TÉRMINOS
    - Scroll hasta el final
    - Checkbox "Acepto"
    - Botón "Continuar" (disabled hasta aceptar)
    ↓
PASO 2: CONTRASEÑA
    - Input nueva contraseña
    - Validación en tiempo real
    - Requirements checklist
    - Input confirmar contraseña
    ↓
POST /auth/complete-onboarding
    ↓
Actualiza user.must_change_password = false
    ↓
Redirect a landing_route (según rol)
```

---

## Consecuencias

### Positivas

✅ **Separación de concerns:** Legal vs Seguridad  
✅ **UX clara:** Un objetivo por paso  
✅ **Validación progresiva:** Feedback inmediato en password  
✅ **Adaptable:** Fácil agregar paso 3 (perfil) si se necesita

### Negativas

⚠️ **Más código:** Orchestrator + 2 subforms vs 1 form  
⚠️ **Estado compartido:** `termsAccepted` debe pasar entre steps

### Neutrales

- Añade componente `ProgressIndicator` (2 círculos)
- Usa `AuthCard` reutilizable (mismo que login/recovery)

---

## Decisiones de Diseño

### 1. Tamaños de Card Distintos

**PASO 1 (Términos):**
```tsx
<AuthCard maxWidth="672px"> {/* Ancho para lectura */}
  <ScrollArea className="h-[400px]">
    {/* Texto legal largo */}
  </ScrollArea>
</AuthCard>
```

**PASO 2 (Password):**
```tsx
<AuthCard maxWidth="448px"> {/* Compacto para acción */}
  <AuthPasswordForm mode="onboarding" />
</AuthCard>
```

**Razón:** El tamaño debe servir al contenido, no a simetría visual.

### 2. Banner Contextual (Colores Metro)

**Onboarding:**
```tsx
<div className="bg-brand/5 border border-brand/20">
  <Info className="text-brand" />
  <p>Esta es tu contraseña definitiva.</p>
</div>
```

**Recovery:**
```tsx
<div className="bg-status-info/10 border border-status-info/30">
  <Info className="text-status-info" />
  <p>Recuperando acceso a tu cuenta.</p>
</div>
```

**Razón:**
- Onboarding = primer contacto → `brand` (naranja Metro)
- Recovery = soporte → `status-info` (azul institucional)

### 3. Validación en Tiempo Real

```tsx
// frontend/src/features/auth/components/onboarding/PasswordRequirements.tsx
const requirements = [
  { label: "8 caracteres mínimo", check: (p) => p.length >= 8 },
  { label: "Una mayúscula", check: (p) => /[A-Z]/.test(p) },
  { label: "Una minúscula", check: (p) => /[a-z]/.test(p) },
  { label: "Un número", check: (p) => /[0-9]/.test(p) },
  { label: "Un símbolo", check: (p) => /[!@#$%^&*]/.test(p) },
];

// Feedback visual por cada requirement
{requirements.map((req) => (
  <li className={req.check(password) ? "text-status-stable" : "text-txt-muted"}>
    {req.check(password) ? <Check /> : <X />}
    {req.label}
  </li>
))}
```

**Razón:** Usuario sabe qué falta sin tener que submitear.

---

## Implementación Backend

### Flag de Estado

```python
# backend/src/infrastructure/repositories/det_user_repository.py
def create_det_user(id_usuario: int):
    cursor.execute("""
        INSERT INTO det_usuarios 
        (id_usuario, cambiar_clave, acepto_terminos)
        VALUES (%s, 'T', 'F')
    """, (id_usuario,))
```

**'T' = True (debe cambiar)** → Frontend detecta `must_change_password=true`

### Completar Onboarding

```python
# backend/src/use_cases/auth/complete_onboarding_usecase.py
def execute(self, user_id: int, new_password: str, terms_accepted: bool):
    # Hashear password
    hashed = generate_password_hash(new_password)
    
    # Actualizar usuario
    self.user_repo.update_password(user_id, hashed)
    
    # Actualizar det_usuarios
    self.det_user_repo.update(user_id, {
        "cambiar_clave": "F",  # Ya no debe cambiar
        "acepto_terminos": "T" if terms_accepted else "F",
    })
    
    return {"message": "Onboarding completado"}, None
```

---

## Guard de Ruta

```tsx
// frontend/src/routes/ProtectedRoute.tsx
if (user.must_change_password || !user.terms_accepted) {
  return <Navigate to="/onboarding" replace />;
}
```

**Razón:** Forzar onboarding antes de acceder al sistema.

---

## Alternativas Consideradas

### 1. Single-step Form

**Pros:**
- Menos código
- Más rápido para el usuario

**Contras:**
- ❌ Mezcla legal con seguridad (concerns distintos)
- ❌ Form largo intimidante
- ❌ Difícil validar checkbox vs password al mismo tiempo

**Decisión:** Rechazado por UX confusa.

### 2. Wizard de 3 Pasos (+Perfil)

**Pros:**
- Podría capturar más datos (teléfono, foto)

**Contras:**
- ❌ Over-engineering (datos no críticos)
- ❌ Más fricción en onboarding
- ❌ Perfil se puede editar después

**Decisión:** Rechazado por YAGNI (You Ain't Gonna Need It).

---

## Validación

### Testing Manual

```bash
# 1. Crear usuario con contraseña temporal
curl -X POST http://localhost:5000/api/v1/users \
  -H "X-CSRF-TOKEN: <csrf>" \
  -b cookies.txt \
  -d '{"usuario":"testnuevo","expediente":"99999999",...}'

# Response incluye temp_password

# 2. Login con temp_password
# Esperado: must_change_password=true → redirect a /onboarding

# 3. Completar paso 1 (términos)
# Esperado: checkbox enabled → botón "Continuar" enabled

# 4. Completar paso 2 (password)
# Esperado: requirements checklist verde → submit enabled

# 5. Submit onboarding
# Esperado: redirect a landing_route (según rol)
```

### Checklist UX

- [ ] Paso 1: Scroll required hasta el final
- [ ] Paso 1: Checkbox disabled hasta scroll completo
- [ ] Paso 1: Botón "Continuar" disabled hasta aceptar
- [ ] Paso 2: Validación en tiempo real (requirements)
- [ ] Paso 2: Password y confirmPassword deben coincidir
- [ ] Paso 2: Submit muestra loading state
- [ ] Post-submit: Toast de éxito + redirect
- [ ] Post-submit: `must_change_password=false` en Zustand

---

## Mejoras Futuras (Roadmap)

1. **Paso 3 (Opcional):** Avatar upload + preferencias
2. **Email de bienvenida:** Confirmar completado onboarding
3. **Analytics:** Track completion rate (cuántos abandonan en paso 1 vs 2)

---

## Referencias

- [Nielsen Norman Group: Multi-Step Forms](https://www.nngroup.com/articles/multi-step-forms/)
- [OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

## Historial

- **2025-12:** Implementación inicial (2 pasos)
- **2025-12:** Refactor: shadcn Checkbox + tokens Metro
- **2026-01:** Documentación como ADR
