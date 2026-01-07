# Email Templates - SIRES

Este directorio contiene los templates HTML para emails transaccionales del sistema SIRES.

## Templates Disponibles

- `reset_code.html` - Email de recuperación de contraseña con código OTP

## Cómo Editar

Los templates usan **inline CSS** para máxima compatibilidad con clientes de email (Gmail, Outlook, Apple Mail).

### Variables disponibles:

Los templates usan placeholders con doble llaves `{{variable}}` que se reemplazan en tiempo de ejecución:

- `{{code}}` - Código OTP de 6 dígitos
- `{{expiry_minutes}}` - Minutos hasta que expire el código (default: 10)

### Paleta de colores Metro CDMX:

```css
--metro-orange: #fe5000
--metro-orange-hover: #d94300
--metro-orange-light: #fff1e6
--text-dark: #1a1a1a
--text-muted: #64748b
--bg-white: #ffffff
--bg-light: #f3f4f6
--border-light: #e2e8f0
```

### Testing

Después de editar un template, probá enviando un email de prueba y verificá en:
- Gmail web
- Gmail móvil
- Outlook web
- Apple Mail (si tenés acceso)
