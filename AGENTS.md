# AGENTS.md - Guía de Desarrollo SIRES

## 🚀 Comandos de Desarrollo

### Frontend (Bun)
```bash
bun dev          # Servidor desarrollo Vite (puerto 5173)
bun build        # Compilar TypeScript + build producción  
bun lint         # Ejecutar ESLint
bun preview      # Previsualizar build de producción
```

### Backend (Python Flask)
```bash
python run.py    # Iniciar servidor Flask (puerto 5000)
pip install -r requirements.txt  # Instalar dependencias
```

### Docker (Recomendado)
```bash
docker-compose up -d        # Iniciar todos los servicios
docker-compose logs -f       # Ver logs en tiempo real
docker-compose down          # Detener servicios
docker-compose exec backend sh # Acceder al contenedor backend
```

## 📝 Guías de Estilo

### Frontend (TypeScript/React)
- **Componentes**: PascalCase (`AuthPasswordForm.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useAuth.ts`)
- **Tipos**: PascalCase con inferencia Zod (`LoginRequest`)
- **Imports**: External → Local con aliases `@/`, `@api/`, `@features/`
- **Validación**: Zod + React Hook Form para formularios
- **Estado**: Zustand con persistencia, TanStack Query para API calls
- **Path aliases**: Configurados en vite.config.ts y tsconfig.json

### Backend (Python Flask)
- **Arquitectura**: Clean architecture (use_cases/, repositories/, infrastructure/)
- **Nomenclatura**: snake_case archivos, PascalCase clases (`LoginUseCase`)
- **Errores**: Excepciones personalizadas con código y status HTTP
- **API**: Flask blueprints, respuestas JSON consistentes
- **Patrón**: Retorno `(result, error)` en use cases
- **Variables**: `.env` separados por servicio, `VITE_*` para frontend

## ⚠️ Notas Importantes
- **Tests**: No configurado actualmente en el proyecto
- **Proxy**: Configuración proxy corporativo en Docker
- **Autenticación**: JWT con refresh tokens, validación en múltiples capas
- **BD**: MySQL con Redis para cache de OTP
- **Desarrollo**: Usar siempre Docker Compose para ambiente completo