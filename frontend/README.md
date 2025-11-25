# 🏥 SIRES - Sistema de Información del Servicio Médico

Frontend del Sistema de Información para el Servicio Médico del Metro de la Ciudad de México.

## 🏗️ Arquitectura

Este proyecto implementa **Clean Architecture** + **Screaming Architecture** con separación por features del negocio.

### Características Principales

- ✅ **Clean Architecture**: Separación por capas (Domain → Application → Infrastructure → Presentation)
- ✅ **Screaming Architecture**: La estructura grita el dominio del negocio
- ✅ **Feature-Sliced Design**: Organización por características
- ✅ **TypeScript Strict Mode**: Máxima seguridad de tipos
- ✅ **React Query**: Manejo de estado del servidor
- ✅ **Zustand**: Estado global ligero
- ✅ **React Hook Form + Zod**: Validación de formularios
- ✅ **Dependency Injection**: Inversión de dependencias
- ✅ **Error Handling**: Manejo centralizado de errores

## 📁 Estructura del Proyecto

```
src/
├── app/                    # Configuración global (Providers, Routes)
├── core/                   # Lógica de negocio compartida
│   ├── domain/            # Entidades, Value Objects, Repositorios base
│   └── application/       # Casos de uso base, Puertos, Servicios
├── features/              # Features del negocio (Screaming Architecture)
│   ├── auth/             # Autenticación (Login, Logout)
│   ├── dashboard/        # Dashboard principal
│   ├── expedientes/      # Gestión de expedientes médicos
│   └── catalogos/        # Catálogos del sistema
├── infrastructure/        # Implementaciones técnicas
│   ├── http/             # Cliente HTTP, Interceptores, Error handling
│   ├── storage/          # LocalStorage, SessionStorage
│   └── config/           # Configuración de variables de entorno
└── shared/               # Código compartido
    ├── ui/               # Componentes UI reutilizables
    ├── hooks/            # Custom hooks genéricos
    ├── utils/            # Utilidades puras
    ├── constants/        # Constantes globales
    └── types/            # Tipos TypeScript compartidos
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.development .env

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📜 Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Vista previa del build de producción
npm run lint         # Ejecuta ESLint
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env` basado en `.env.development`:

```env
VITE_API_URL=http://localhost:5000
VITE_API_VERSION=v1
VITE_ENV=development
VITE_ENABLE_DEV_TOOLS=true
```

### Path Aliases

El proyecto usa path aliases configurados en `tsconfig.json`:

```typescript
import { Button } from "@/shared/ui/components/Button";
import { useAuth } from "@/features/auth/presentation/hooks/useAuth";
import { httpClient } from "@/infrastructure/http/client";
```

## 🎯 Cómo Agregar Features

### Pasos Básicos

1. **Crear estructura del feature**

   ```
   features/mi-feature/
   ├── domain/
   ├── application/
   ├── infrastructure/
   └── presentation/
   ```

2. **Implementar por capas**

   - Domain: Entidades y lógica de negocio
   - Application: Casos de uso
   - Infrastructure: Repositorios
   - Presentation: UI (Componentes, Hooks, Páginas)

3. **Registrar rutas**
   - Agregar en `app/routes/index.tsx`

## 📚 Stack Tecnológico

### Core

- **React 19** - Librería UI
- **TypeScript 5.9** - Tipado estático
- **Vite 7** - Build tool

### Estado y Datos

- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client

### Formularios

- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de schemas

### Estilos

- **Tailwind CSS 4** - Utility-first CSS

### Routing

- **React Router v7** - Routing

### Calidad de Código

- **ESLint** - Linting
- **TypeScript Strict Mode** - Type checking

### Clean Architecture

```
Presentation → Application → Domain ← Infrastructure
```

Las capas internas no conocen las externas. Domain es el núcleo.

## 📝 Convenciones de Código

### Naming

- **Componentes**: `PascalCase` → `LoginForm.tsx`
- **Hooks**: `camelCase` con `use` → `useAuth.ts`
- **Casos de Uso**: `PascalCase` con `UseCase` → `LoginUseCase.ts`
- **Interfaces**: Prefijo `I` → `IAuthRepository`

### Imports

```typescript
// 1. Librerías externas
import { useState } from "react";

// 2. Absolute imports
import { Button } from "@/shared/ui/components/Button";

// 3. Relative imports
import { LoginForm } from "../components/LoginForm";

// 4. Tipos
import type { User } from "../types";
```
