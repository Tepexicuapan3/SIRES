# SIRES

Sistema de Información y Registro de Eventos y Servicios

## 📋 Descripción

Proyecto full-stack con backend y frontend orquestados mediante Docker.

## 🏗️ Estructura del Proyecto

```
SIRES/
├── backend/              # API Flask (Python)
│   ├── .env.example
│   ├── .env.development
│   ├── .env.production
│   ├── Dockerfile
│   └── app.py
├── frontend/             # Interfaz con Vite + React
│   ├── .env.example
│   ├── .env.development
│   ├── .env.production
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example          # Variables globales de Docker
├── .dockerignore
├── .gitignore
└── README.md
```

## 🚀 Requisitos Previos

- [Docker](https://www.docker.com/get-started) (v20.10 o superior)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0 o superior)
- **MySQL** instalado localmente en tu red local

## ⚙️ Configuración Inicial

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/Luis-Ant/SIRES.git
   cd SIRES
   ```

2. **Configurar variables de entorno:**

   ```bash
   # Variables globales de Docker (puertos)
   cp .env.example .env

   # Variables del Backend (Flask + MySQL)
   cp backend/.env.development backend/.env
   # O para producción:
   # cp backend/.env.production backend/.env

   # Variables del Frontend (Vite)
   cp frontend/.env.development frontend/.env
   # O para producción:
   # cp frontend/.env.production frontend/.env
   ```

3. **Configurar la base de datos MySQL local:**

   Edita `backend/.env` y ajusta las credenciales de MySQL:

   ```
   DB_HOST=host.docker.internal  # Para conectar desde Docker a tu máquina local
   DB_PORT=3306
   DB_NAME=sires_db
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   ```

4. **Crear la base de datos en MySQL:**
   ```bash
   mysql -u root -p
   CREATE DATABASE sires_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

## 🐳 Uso con Docker

### Levantar todos los servicios

```bash
docker-compose up -d
```

Este comando iniciará:

- **Backend (Flask)** en el puerto 5000
- **Frontend (Vite)** en el puerto 5173
- Se conectará a tu **MySQL local** en la red

### Ver logs

```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Detener los servicios

```bash
docker-compose down
```

### Reconstruir las imágenes

```bash
docker-compose up -d --build
```

## 📦 Servicios

## 📦 Servicios

### Backend (API Flask)

- **URL:** http://localhost:5000
- **Health Check:** http://localhost:5000/health
- **Tecnologías:** Python, Flask, MySQL
- **Conexión BD:** MySQL local en red (host.docker.internal)

### Frontend (Vite + React)

- **URL:** http://localhost:5173
- **Tecnologías:** Node.js, Vite, React

### Base de Datos

- **Ubicación:** MySQL local en tu red local
- **Puerto:** 3306
- **Motor:** MySQL 8.0+

## 🔐 Variables de Entorno

### Estructura de archivos .env

El proyecto usa **tres niveles** de variables de entorno:

1. **`.env`** (raíz) - Variables globales de Docker Compose
   - Puertos de los servicios
2. **`backend/.env`** - Variables específicas de Flask
   - Configuración de Flask
   - Conexión a MySQL local
   - Secretos y tokens
   - CORS
3. **`frontend/.env`** - Variables específicas de Vite
   - URL del API (VITE_API_URL)
   - Configuración de la app
   - ⚠️ Solo las variables con prefijo `VITE_` son accesibles en el navegador

### Entornos: Desarrollo vs Producción

Cada carpeta tiene tres archivos:

- `.env.example` - Plantilla con documentación
- `.env.development` - Valores para desarrollo
- `.env.production` - Valores para producción

**Para cambiar de entorno:**

```bash
# Desarrollo
cp backend/.env.development backend/.env
cp frontend/.env.development frontend/.env

# Producción
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env
```

## 🔧 Comandos Útiles

### Acceder al contenedor

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

### Instalar dependencias

```bash
# Backend (Python)
docker-compose exec backend pip install <paquete>

# Frontend (Node)
docker-compose exec frontend npm install <paquete>
```

### Conectar a MySQL local

```bash
mysql -u root -p -h localhost -P 3306
USE sires_db;
```

### Ejecutar migraciones (cuando estén configuradas)

```bash
docker-compose exec backend flask db upgrade
```

## 🛠️ Desarrollo

### Modo de desarrollo

El `docker-compose.yml` ya está configurado para desarrollo con:

- **Hot-reload** automático en frontend (Vite) y backend (Flask)
- Volúmenes montados para cambios en tiempo real
- Variables de entorno separadas por servicio

### Estructura de desarrollo

Cada servicio (backend/frontend) debe tener:

- `Dockerfile` - Para producción
- `Dockerfile.dev` - Para desarrollo (opcional)
- Archivos `.env` - Variables de entorno
- Código fuente en sus respectivas carpetas

### Conexión a MySQL local desde Docker

Los contenedores Docker usan `host.docker.internal` para conectarse a servicios en tu máquina local (como MySQL). Esto ya está configurado en `backend/.env.development`.

## 📝 Importante sobre Variables de Entorno

### ✅ Buenas prácticas:

1. **Nunca** subas archivos `.env` al repositorio (ya están en `.gitignore`)
2. **Siempre** mantén actualizado el `.env.example` con nuevas variables
3. **Backend:** Todas las variables son privadas y seguras
4. **Frontend:** Solo las variables `VITE_*` son accesibles en el navegador
   - ⚠️ NO pongas secrets o claves API con el prefijo `VITE_`
5. **Producción:** Usa `.env.production` y cambia todos los secrets

### Archivo activo por entorno:

```bash
# El archivo que Docker Compose lee es siempre: backend/.env y frontend/.env
# Tú decides si copias el contenido desde .development o .production
```

```

## 🤝 Contribución

1. Crea una rama para tu feature: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y commits: `git commit -am 'Agrega nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE.

## 👥 Autor

Luis-Ant

---

**Notas importantes:**
- Asegúrate de que **Docker Desktop** esté ejecutándose antes de usar cualquier comando de Docker
- La **base de datos MySQL** debe estar corriendo en tu máquina local antes de levantar los contenedores
- Verifica que el puerto **3306** (MySQL), **5000** (Backend) y **5173** (Frontend) estén disponibles
```
