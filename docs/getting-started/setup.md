# Setup - SIRES

Guía rápida para levantar el proyecto desde cero.

---

## Requisitos

- **Docker** v20.10+
- **MySQL** 8.0+ (local o remoto)
- **Git**

---

## Instalación (5 minutos)

### 1. Clonar el repo

```bash
git clone https://github.com/Luis-Ant/SIRES.git
cd SIRES
```

### 2. Configurar variables de entorno

El proyecto usa **tres niveles** de `.env`:

```
SIRES/
├── .env                # Docker Compose (puertos)
├── backend/.env        # Flask (BD, JWT, CORS)
└── frontend/.env       # Vite (API URL)
```

**Copiar plantillas:**

```bash
# Desarrollo (recomendado)
cp backend/.env.development backend/.env
cp frontend/.env.development frontend/.env

# Producción
cp backend/.env.production backend/.env
cp frontend/.env.production frontend/.env
```

### 3. Configurar MySQL

**Opción A: MySQL local**

Ya está configurado en `.env.development`:

```env
# backend/.env
MYSQL_HOST=host.docker.internal  # ← Accede a localhost desde Docker
MYSQL_PORT=3306
MYSQL_USER=sires
MYSQL_PASSWORD=tu_password
MYSQL_DATABASE=SIRES
```

**Opción B: MySQL remoto**

Cambiá `MYSQL_HOST` a la IP/hostname del servidor.

**Crear la BD:**

```sql
CREATE DATABASE SIRES CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'sires'@'%' IDENTIFIED BY 'tu_password';
GRANT ALL PRIVILEGES ON SIRES.* TO 'sires'@'%';
FLUSH PRIVILEGES;
```

### 4. Levantar servicios

```bash
docker-compose up -d
```

Esto inicia:
- **Backend** (Flask) → `http://localhost:5000`
- **Frontend** (Vite) → `http://localhost:5173`
- **Redis** → `localhost:6379`

**Ver logs:**

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5. Verificar

**Health check backend:**

```bash
curl http://localhost:5000/health
# Esperado: {"status": "ok"}
```

**Abrir frontend:**

```
http://localhost:5173/login
```

---

## Comandos Útiles

### Docker

```bash
# Detener servicios
docker-compose down

# Reconstruir imágenes
docker-compose up -d --build

# Acceder al contenedor
docker-compose exec backend sh
docker-compose exec frontend sh

# Ver logs en tiempo real
docker-compose logs -f
```

### Backend (Python)

```bash
# Instalar dependencia
docker-compose exec backend pip install <paquete>

# Ejecutar script
docker-compose exec backend python run.py

# Acceder a MySQL desde el contenedor
docker-compose exec backend mysql -h $MYSQL_HOST -u $MYSQL_USER -p
```

### Frontend (Bun)

```bash
# Instalar dependencia
docker-compose exec frontend bun add <paquete>

# Lint
docker-compose exec frontend bun lint

# Build
docker-compose exec frontend bun build
```

---

## Variables de Entorno (Detalle)

### `backend/.env` (Flask)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `FLASK_ENV` | Entorno | `development` o `production` |
| `SECRET_KEY` | Clave para JWT | Generá una con `openssl rand -hex 32` |
| `JWT_SECRET_KEY` | Clave específica JWT | Generá otra distinta |
| `MYSQL_HOST` | Host de BD | `host.docker.internal` (local) |
| `MYSQL_PORT` | Puerto BD | `3306` |
| `MYSQL_USER` | Usuario BD | `sires` |
| `MYSQL_PASSWORD` | Password BD | `tu_password` |
| `MYSQL_DATABASE` | Nombre BD | `SIRES` |
| `CORS_ORIGINS` | Origins permitidos | `http://localhost:5173` |

### `frontend/.env` (Vite)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL del backend | `http://localhost:5000/api/v1` |

**⚠️ IMPORTANTE:** Solo variables con prefijo `VITE_` son accesibles en el navegador. **NO** pongas secrets con ese prefijo.

---

## Troubleshooting

### Error: "Can't connect to MySQL server"

**Causa:** Backend no puede conectarse a MySQL.

**Solución:**

1. Verificá que MySQL esté corriendo:
   ```bash
   mysql -u root -p -h localhost -P 3306
   ```

2. Si usás Docker Desktop en Windows/Mac, usá `host.docker.internal`:
   ```env
   MYSQL_HOST=host.docker.internal
   ```

3. Si usás Linux, agregá esto a `docker-compose.yml`:
   ```yaml
   extra_hosts:
     - "host.docker.internal:host-gateway"
   ```

### Error: "Port 5000 already in use"

**Causa:** Otro servicio (AirPlay en Mac, por ejemplo) usa el puerto 5000.

**Solución:**

Cambiar puerto en `.env` raíz:

```env
BACKEND_PORT=5001
```

Y en `frontend/.env`:

```env
VITE_API_URL=http://localhost:5001/api/v1
```

### Error: CORS en el navegador

**Causa:** Backend no permite el origin del frontend.

**Solución:**

En `backend/.env`:

```env
CORS_ORIGINS=http://localhost:5173
```

Si usás otro puerto, agregalo separado por comas:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend muestra pantalla blanca

**Causa:** Error en build o en el código.

**Solución:**

1. Verificá logs:
   ```bash
   docker-compose logs frontend
   ```

2. Revisá la consola del navegador (F12)

3. Reconstruí el contenedor:
   ```bash
   docker-compose up -d --build frontend
   ```

---

## Desarrollo sin Docker (Opcional)

### Backend local

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

### Frontend local

```bash
cd frontend
bun install
bun dev
```

**Nota:** Si desarrollás sin Docker, cambiá `MYSQL_HOST` a `localhost` en `backend/.env`.

---

## Próximos Pasos

1. **Entender la arquitectura:** Ver `docs/architecture/overview.md`
2. **Explorar RBAC:** Ver `docs/architecture/rbac.md`
3. **Crear tu primera feature:** Ver `docs/guides/adding-feature.md`
4. **Componentes UI:** Ver `docs/guides/ui-components.md`

---

**Última actualización:** Enero 2026
