# Auditoría de Onboarding

## Descripción
Este documento describe la implementación de auditoría para el proceso de onboarding, específicamente cuando el usuario acepta los términos y condiciones.

## Implementación

### Registro de Auditoría
Cuando un usuario completa el proceso de onboarding, se registra automáticamente en la tabla `bit_accesos` con los siguientes datos:

- **id_usuario**: ID del usuario que completó el onboarding
- **ip_ultima**: Dirección IP desde la cual se realizó la aceptación
- **conexion_act**: Estado fijo "TÉRMINOS ACEPTADOS"
- **fecha_conexion**: Timestamp automático de cuando se aceptaron los términos

### Ubicación en el Código
**Archivo**: `backend/src/use_cases/auth/complete_onboarding_usecase.py`

```python
# Línea 95-99
self.audit_repo.registrar_acceso(
    id_usuario=user_id,
    ip=client_ip,
    conexion_act="TÉRMINOS ACEPTADOS"
)
```

### Flujo de Auditoría

1. Usuario acepta términos y condiciones en el frontend
2. Backend valida que `terms_accepted = True`
3. Se actualiza la base de datos:
   - `det_usuarios.terminos_acept = 'T'`
   - `det_usuarios.cambiar_clave = 'F'`
4. **Se registra la auditoría en `bit_accesos`**
5. Se generan los tokens de acceso completo

### Estructura de la Tabla bit_accesos

```sql
CREATE TABLE bit_accesos (
    id_acceso INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    ip_ultima VARCHAR(45),
    conexion_act VARCHAR(50),
    fecha_conexion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES sy_usuarios(id_usuario)
);
```

### Consultas Útiles

#### Ver todos los usuarios que aceptaron términos
```sql
SELECT 
    u.usuario,
    u.nombre,
    u.paterno,
    a.fecha_conexion AS fecha_aceptacion_terminos,
    a.ip_ultima
FROM bit_accesos a
INNER JOIN sy_usuarios u ON a.id_usuario = u.id_usuario
WHERE a.conexion_act = 'TÉRMINOS ACEPTADOS'
ORDER BY a.fecha_conexion DESC;
```

#### Ver última aceptación de términos por usuario
```sql
SELECT 
    u.usuario,
    u.nombre,
    MAX(a.fecha_conexion) AS ultima_aceptacion
FROM bit_accesos a
INNER JOIN sy_usuarios u ON a.id_usuario = u.id_usuario
WHERE a.conexion_act = 'TÉRMINOS ACEPTADOS'
GROUP BY u.id_usuario, u.usuario, u.nombre
ORDER BY ultima_aceptacion DESC;
```

## Notas Importantes

1. **No se registra versión de términos**: Por solicitud específica, no se incluye un campo de versión de los términos y condiciones.

2. **Solo fecha de aceptación**: La fecha se registra automáticamente en `fecha_conexion` mediante el timestamp de MySQL.

3. **Estados de conexión registrados**:
   - `"EN SESIÓN"` - Login exitoso
   - `"FUERA DE SESIÓN"` - Logout
   - `"TÉRMINOS ACEPTADOS"` - Onboarding completado

4. **Integridad**: El registro de auditoría ocurre DESPUÉS de actualizar el estado en `det_usuarios`, pero ANTES de generar los tokens finales. Esto garantiza que si falla algo después, el registro quedó guardado.

## Seguridad

- La IP se obtiene del request real (no se puede falsificar desde el cliente)
- El `user_id` se extrae del JWT validado (no del body del request)
- El scope del JWT debe ser `"onboarding"` para ejecutar este use case
