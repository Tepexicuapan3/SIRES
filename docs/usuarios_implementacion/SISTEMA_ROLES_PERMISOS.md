# Sistema de Roles y Permisos - SIRES

## Descripcion General

El sistema SIRES implementa un modelo de **Control de Acceso Basado en Roles (RBAC)** con soporte para permisos personalizados por usuario. Este documento detalla la arquitectura, tablas de base de datos, relaciones y flujos de autorizacion.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USUARIO                                        │
│                           (sy_usuarios)                                     │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ 1:N
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ASIGNACION DE ROL                                  │
│                           (users_roles)                                     │
│                                                                             │
│   tp_asignacion = 'ROL'  ──────────┬────────── tp_asignacion = 'PERS'      │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼                                       ▼
┌────────────────────────────────┐     ┌────────────────────────────────────┐
│        PERMISOS POR ROL        │     │      PERMISOS PERSONALIZADOS       │
│         (det_roles)            │     │    (det_roles_personalizados)      │
│                                │     │                                    │
│  ROL → [MENU, SUBMENU, ...]    │     │  USUARIO → [MENU, SUBMENU, ...]   │
└────────────────────────────────┘     └────────────────────────────────────┘
                 │                                       │
                 └───────────────────┬───────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CATALOGOS                                      │
│                                                                             │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│   │    cat_roles     │    │    cat_menus     │    │   cat_submenus   │     │
│   │                  │    │                  │    │                  │     │
│   │  ADMINISTRADOR   │    │  CATALOGOS       │    │  Escuelas        │     │
│   │  MEDICO          │    │  HERRAMIENTAS    │    │  Especialidades  │     │
│   │  RECEPCION       │    │  ADMINISTRACION  │    │  Usuarios        │     │
│   │  FARMACIA        │    │  ...             │    │  ...             │     │
│   │  PERSONALIZADO   │    │                  │    │                  │     │
│   └──────────────────┘    └──────────────────┘    └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablas de Base de Datos

### 1. `sy_usuarios` - Usuarios del Sistema

Tabla principal que almacena la informacion de los usuarios.

| Campo | Tipo | Nullable | Descripcion |
|-------|------|----------|-------------|
| `id_usuario` | INT | NO (PK, AI) | Identificador unico del usuario |
| `usuario` | VARCHAR(20) | SI | Nombre de usuario (login) |
| `clave` | VARCHAR(300) | SI | Contrasena hasheada (werkzeug) |
| `nombre` | VARCHAR(45) | SI | Nombre(s) del usuario |
| `paterno` | VARCHAR(45) | SI | Apellido paterno |
| `materno` | VARCHAR(45) | SI | Apellido materno |
| `expediente` | VARCHAR(8) | SI | Numero de expediente |
| `curp` | VARCHAR(45) | SI | CURP del usuario |
| `img_perfil` | VARCHAR(100) | SI | Ruta de imagen de perfil |
| `correo` | VARCHAR(100) | SI | Correo electronico |
| `est_usuario` | VARCHAR(1) | NO | Estado: 'A'=Activo, 'B'=Baja |
| `usr_alta` | VARCHAR(20) | SI | Usuario que dio de alta |
| `fch_alta` | DATETIME | SI | Fecha de alta |
| `usr_modf` | VARCHAR(20) | SI | Usuario que modifico |
| `fch_modf` | DATETIME | SI | Fecha de modificacion |
| `usr_baja` | VARCHAR(20) | SI | Usuario que dio de baja |
| `fch_baja` | DATETIME | SI | Fecha de baja |

**Constraints:**
- `usuario_UNIQUE` - Usuario unico
- `expediente_UNIQUE` - Expediente unico
- `curp_UNIQUE` - CURP unico
- `correo_UNIQUE` - Correo unico

---

### 2. `cat_roles` - Catalogo de Roles

Define los roles disponibles en el sistema.

| Campo | Tipo | Nullable | Descripcion |
|-------|------|----------|-------------|
| `id_rol` | INT | NO (PK, AI) | Identificador unico del rol |
| `rol` | VARCHAR(50) | NO | Nombre del rol (ej: ADMINISTRADOR) |
| `tp_rol` | VARCHAR(5) | NO | Tipo/Codigo corto del rol |
| `desc_rol` | VARCHAR(200) | NO | Descripcion del rol |
| `est_rol` | VARCHAR(1) | NO | Estado: 'A'=Activo, 'B'=Baja |
| `usr_alta` | VARCHAR(20) | NO | Usuario que creo el rol |
| `fch_alta` | DATETIME | SI | Fecha de creacion |
| `usr_modf` | VARCHAR(20) | SI | Usuario que modifico |
| `fch_modf` | DATETIME | SI | Fecha de modificacion |
| `usr_baja` | VARCHAR(20) | SI | Usuario que dio de baja |
| `fch_baja` | DATETIME | SI | Fecha de baja |

**Constraints:**
- `rol_UNIQUE` - Nombre de rol unico
- `tp_rol` debe ser unico

**Roles especiales:**
- `ADMINISTRADOR` - Tiene acceso a TODOS los menus y submenus automaticamente
- `PERSONALIZADO` - Permite asignar submenus especificos a un usuario

---

### 3. `cat_menus` - Catalogo de Menus

Define los menus principales de la aplicacion.

| Campo | Tipo | Nullable | Descripcion |
|-------|------|----------|-------------|
| `id_menu` | INT | NO (PK, AI) | Identificador unico del menu |
| `menu` | VARCHAR(50) | NO | Nombre del menu |
| `desc_menu` | VARCHAR(200) | NO | Descripcion del menu |
| `clave_search` | VARCHAR(1) | NO | Clave para busqueda rapida |
| `est_menu` | VARCHAR(1) | NO | Estado: 'A'=Activo, 'B'=Baja |
| `usr_alta` | VARCHAR(20) | NO | Usuario que creo |
| `fch_alta` | DATETIME | SI | Fecha de creacion |
| `usr_modf` | VARCHAR(20) | SI | Usuario que modifico |
| `fch_modf` | DATETIME | SI | Fecha de modificacion |
| `usr_baja` | VARCHAR(20) | SI | Usuario que dio de baja |
| `fch_baja` | DATETIME | SI | Fecha de baja |

---

### 4. `cat_submenus` - Catalogo de Submenus

Define los submenus (funcionalidades) dentro de cada menu.

| Campo | Tipo | Nullable | Descripcion |
|-------|------|----------|-------------|
| `id_submenu` | INT | NO (PK, AI) | Identificador unico del submenu |
| `id_menu` | INT | NO (FK) | Referencia al menu padre |
| `submenu` | VARCHAR(50) | NO | Nombre del submenu |
| `desc_submenu` | VARCHAR(200) | NO | Descripcion del submenu |
| `url` | VARCHAR(100) | NO | Endpoint de Flask (ej: `catalogos.escuelas`) |
| `est_submenu` | VARCHAR(1) | NO | Estado: 'A'=Activo, 'B'=Baja |
| `usr_alta` | VARCHAR(20) | NO | Usuario que creo |
| `fch_alta` | DATETIME | SI | Fecha de creacion |
| `usr_modf` | VARCHAR(20) | SI | Usuario que modifico |
| `fch_modf` | DATETIME | SI | Fecha de modificacion |
| `usr_baja` | VARCHAR(20) | SI | Usuario que dio de baja |
| `fch_baja` | DATETIME | SI | Fecha de baja |

**Constraints:**
- `consult_UNIQUE` - Combinacion (id_menu, submenu) unica

**Relaciones:**
- `id_menu` → `cat_menus.id_menu` (FK)

---

### 5. `users_roles` - Asignacion de Roles a Usuarios

Tabla pivote que relaciona usuarios con roles.

| Campo | Tipo | Nullable | Descripcion |
|-------|------|----------|-------------|
| `id_usr_roles` | INT | NO (PK, AI) | Identificador unico |
| `id_usuario` | INT | NO (FK) | Referencia al usuario |
| `id_rol` | INT | NO (FK) | Referencia al rol |
| `tp_asignacion` | VARCHAR(10) | NO | Tipo: 'ROL' o 'PERS' (Personalizado) |
| `est_usr_rol` | VARCHAR(1) | NO | Estado: 'A'=Activo, 'B'=Baja |
| `usr_alta` | VARCHAR(20) | NO | Usuario que asigno |
| `fch_alta` | DATETIME | NO | Fecha de asignacion |
| `usr_modf` | VARCHAR(20) | SI | Usuario que modifico |
| `fch_modf` | DATETIME | SI | Fecha de modificacion |
| `usr_baja` | VARCHAR(20) | SI | Usuario que dio de baja |
| `fch_baja` | DATETIME | SI | Fecha de baja |

**Constraints:**
- `uq_usuario_rol` - Combinacion (id_usuario, id_rol) unica

**Relaciones:**
- `id_usuario` → `sy_usuarios.id_usuario` (FK)
- `id_rol` → `cat_roles.id_rol` (FK)

---

### 6. `det_roles` - Detalle de Permisos por Rol

Define que menus/submenus tiene acceso cada rol.

| Campo | Tipo | Nullable | Descripcion |
|-------|------|----------|-------------|
| `id_detrol` | INT | NO (PK, AI) | Identificador unico |
| `id_rol` | INT | NO (FK) | Referencia al rol |
| `id_menu` | INT | NO (FK) | Referencia al menu |
| `id_submenu` | INT | NO (FK) | Referencia al submenu |
| `est_detrol` | VARCHAR(1) | NO | Estado: 'A'=Activo, 'B'=Baja |
| `usr_alta` | VARCHAR(20) | NO | Usuario que creo |
| `fch_alta` | DATETIME | NO | Fecha de creacion |
| `usr_modf` | VARCHAR(20) | SI | Usuario que modifico |
| `fch_modf` | DATETIME | SI | Fecha de modificacion |
| `usr_baja` | VARCHAR(20) | SI | Usuario que dio de baja |
| `fch_baja` | DATETIME | SI | Fecha de baja |

**Constraints:**
- `uq_rol_menu_submenu` - Combinacion (id_rol, id_menu, id_submenu) unica

**Relaciones:**
- `id_rol` → `cat_roles.id_rol` (FK)
- `id_menu` → `cat_menus.id_menu` (FK)
- `id_submenu` → `cat_submenus.id_submenu` (FK)

---

### 7. `det_roles_personalizados` - Permisos Personalizados por Usuario

Permite asignar permisos especificos a un usuario sin usar un rol predefinido.

| Campo | Tipo | Nullable | Descripcion |
|-------|------|----------|-------------|
| `id_detpersonalizado` | INT | NO (PK, AI) | Identificador unico |
| `id_usuario` | INT | NO (FK) | Referencia al usuario |
| `id_rol` | INT | NO (FK) | Referencia al rol (PERSONALIZADO) |
| `id_menu` | INT | NO (FK) | Referencia al menu |
| `id_submenu` | INT | NO (FK) | Referencia al submenu |
| `tp_asignacion` | VARCHAR(10) | NO | Formato: '0-{id_usuario}' |
| `est_detpersonalizado` | VARCHAR(1) | NO | Estado: 'A'=Activo, 'B'=Baja |
| `usr_alta` | VARCHAR(20) | NO | Usuario que creo |
| `fch_alta` | DATETIME | NO | Fecha de creacion |
| `usr_modf` | VARCHAR(20) | SI | Usuario que modifico |
| `fch_modf` | DATETIME | SI | Fecha de modificacion |
| `usr_baja` | VARCHAR(20) | SI | Usuario que dio de baja |
| `fch_baja` | DATETIME | SI | Fecha de baja |

**Relaciones:**
- `id_usuario` → `sy_usuarios.id_usuario` (FK)
- `id_rol` → `cat_roles.id_rol` (FK)
- `id_menu` → `cat_menus.id_menu` (FK)
- `id_submenu` → `cat_submenus.id_submenu` (FK)

---

## Diagrama Entidad-Relacion

```
                                    ┌─────────────────┐
                                    │   cat_roles     │
                                    ├─────────────────┤
                         ┌─────────►│ id_rol (PK)     │◄─────────┐
                         │          │ rol             │          │
                         │          │ tp_rol          │          │
                         │          │ desc_rol        │          │
                         │          │ est_rol         │          │
                         │          └─────────────────┘          │
                         │                                       │
                         │                                       │
┌─────────────────┐      │      ┌─────────────────┐      ┌──────┴────────┐
│  sy_usuarios    │      │      │   users_roles   │      │   det_roles   │
├─────────────────┤      │      ├─────────────────┤      ├───────────────┤
│ id_usuario (PK) │◄─────┼──────│ id_usuario (FK) │      │ id_rol (FK)   │
│ usuario         │      │      │ id_rol (FK) ────┼──────┤ id_menu (FK)  │
│ clave           │      │      │ tp_asignacion   │      │ id_submenu(FK)│
│ nombre          │      │      │ est_usr_rol     │      │ est_detrol    │
│ expediente      │      │      └─────────────────┘      └───────────────┘
│ est_usuario     │      │                                       │
└─────────────────┘      │                                       │
         │               │                                       │
         │               │      ┌──────────────────────────┐     │
         │               │      │ det_roles_personalizados │     │
         │               │      ├──────────────────────────┤     │
         └───────────────┼──────│ id_usuario (FK)          │     │
                         │      │ id_rol (FK)──────────────┼─────┘
                         │      │ id_menu (FK)─────────────┼─────────┐
                         │      │ id_submenu (FK)──────────┼─────────┼──┐
                         │      │ tp_asignacion            │         │  │
                         │      │ est_detpersonalizado     │         │  │
                         │      └──────────────────────────┘         │  │
                         │                                           │  │
                         │          ┌─────────────────┐              │  │
                         │          │    cat_menus    │              │  │
                         │          ├─────────────────┤              │  │
                         └──────────│ id_menu (PK)    │◄─────────────┘  │
                                    │ menu            │                 │
                                    │ desc_menu       │                 │
                                    │ est_menu        │                 │
                                    └────────┬────────┘                 │
                                             │                          │
                                             │ 1:N                      │
                                             ▼                          │
                                    ┌─────────────────┐                 │
                                    │  cat_submenus   │                 │
                                    ├─────────────────┤                 │
                                    │ id_submenu (PK) │◄────────────────┘
                                    │ id_menu (FK)    │
                                    │ submenu         │
                                    │ url             │
                                    │ est_submenu     │
                                    └─────────────────┘
```

---

## Flujo de Autorizacion

### 1. Login y Carga Inicial de Permisos

Cuando un usuario inicia sesion, el sistema ejecuta el siguiente flujo:

```python
# Archivo: app/modules/users/routes.py - Funcion login()

1. Usuario envia credenciales (usuario + clave)
2. Se valida el usuario en sy_usuarios
3. Se verifica la contrasena con check_password_hash()
4. Si es correcto:
   a. login_user(user) - Flask-Login
   b. Se actualiza det_usuarios (last_conexion, act_conexion, ip)
   c. Se registra en bit_accesos (bitacora)
   d. actualizar_permisos_en_sesion(user.id_usuario)
   e. Redirect a inicio
```

### 2. Funcion `obtener_permisos_usuario(id_usuario)`

Esta funcion central calcula los permisos del usuario:

```python
# Archivo: app/modules/users/utils_users.py

def obtener_permisos_usuario(id_usuario):
    # 1. Obtener roles activos del usuario
    roles = UserRoles.query.filter_by(id_usuario=id_usuario, est_usr_rol='A').all()
    
    # 2. Verificar si es ADMINISTRADOR (acceso total)
    es_admin = any(
        ur.rol.rol.upper() == 'ADMINISTRADOR' and ur.est_usr_rol == 'A'
        for ur in roles if ur.tp_asignacion == 'ROL' and ur.rol
    )
    
    permisos = set()
    
    if es_admin:
        # 3a. Si es admin, cargar TODOS los submenus activos
        submenus = CatSubMenus.query.filter_by(est_submenu='A').all()
        for sm in submenus:
            permisos.add((sm.id_menu, sm.id_submenu))
    else:
        # 3b. Si no es admin, iterar por cada rol
        for ur in roles:
            if ur.tp_asignacion == 'ROL':
                # Permisos definidos en det_roles
                det_roles = DetRoles.query.filter_by(id_rol=ur.id_rol, est_detrol='A').all()
                for dr in det_roles:
                    permisos.add((dr.id_menu, dr.id_submenu))
            
            elif ur.tp_asignacion == 'PERS':
                # Permisos personalizados en det_roles_personalizados
                det_pers = DetRolesPersonalizados.query.filter_by(
                    id_usuario=id_usuario, 
                    est_detpersonalizado='A'
                ).all()
                for dp in det_pers:
                    permisos.add((dp.id_menu, dp.id_submenu))
    
    # 4. Construir diccionario de menus con submenus
    return menu_dict
```

### 3. Funcion `actualizar_permisos_en_sesion(id_usuario)`

Almacena los permisos en la sesion de Flask:

```python
# Archivo: app/modules/users/routes.py

def actualizar_permisos_en_sesion(id_usuario):
    # 1. Obtener permisos
    permisos_dict = obtener_permisos_usuario(id_usuario)
    session['menus'] = permisos_dict
    
    # 2. Calcular URLs permitidas
    urls_permitidas = []
    for menu in permisos_dict.values():
        for submenu in menu['submenus']:
            endpoint = submenu['url']
            url = url_for(endpoint)  # Convierte 'catalogos.escuelas' → '/catalogos/escuelas'
            urls_permitidas.append(url)
    session['urls_permitidas'] = urls_permitidas
    
    # 3. Calcular URLs NO permitidas (todas las activas - permitidas)
    submenus_activos = CatSubMenus.query.filter_by(est_submenu='A').all()
    urls_registradas = [url_for(sm.url) for sm in submenus_activos]
    
    urls_nopermitidas = list(set(urls_registradas) - set(urls_permitidas))
    session['urls_nopermitidas'] = urls_nopermitidas
```

### 4. Actualizacion Automatica de Permisos

Los permisos se refrescan automaticamente cada 60 segundos:

```python
# Archivo: app/__init__.py

@app.before_request
def actualizar_permisos_si_autenticado():
    if current_user.is_authenticated:
        last_update = session.get('last_perms_update', 0)
        now = time.time()
        if now - last_update > 60:
            actualizar_permisos_en_sesion(current_user.id_usuario)
            session['last_perms_update'] = now
```

### 5. Proteccion de Rutas por Blueprint

Cada blueprint protege sus rutas con `before_request`:

```python
# Ejemplo: app/modules/administracion/routes.py

@administracion_bp.before_request
def proteger_rutas_administracion():
    # 1. Verificar autenticacion
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))
    
    # 2. Verificar si la ruta esta en la lista de no permitidas
    urls_nopermitidas = session.get('urls_nopermitidas', [])
    current_path = urlparse(request.path).path.lower()
    
    if any(current_path == urlparse(url).path.lower() for url in urls_nopermitidas):
        abort(403)  # Forbidden
```

---

## Estructura de Datos en Sesion

```python
session = {
    'menus': {
        1: {  # id_menu
            'menu': 'CATALOGOS',
            'descripcion': 'CATALOGOS',
            'clave_search': 'C',
            'submenus': [
                {'nombre': 'Escuelas', 'url': 'catalogos.escuelas'},
                {'nombre': 'Especialidades', 'url': 'catalogos.especialidades'},
                # ...
            ]
        },
        2: {
            'menu': 'HERRAMIENTAS',
            # ...
        }
    },
    'urls_permitidas': [
        '/catalogos/escuelas',
        '/catalogos/especialidades',
        '/herramientas/roles',
        # ...
    ],
    'urls_nopermitidas': [
        '/administracion/user_roles',
        '/herramientas/sincronizacion',
        # ...
    ],
    'last_perms_update': 1735489200.123  # timestamp
}
```

---

## Endpoints API de Administracion de Roles

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/administracion/buscar_usuario` | GET | Busca usuarios activos por nombre/expediente (autocompletado) |
| `/administracion/buscar_rol` | GET | Busca roles activos por nombre (autocompletado) |
| `/administracion/get_rol_por_usuario` | GET | Obtiene el rol asignado a un usuario especifico |
| `/administracion/get_submenus_por_rol` | GET | Obtiene los submenus asignados a un rol |
| `/administracion/get_submenus_personalizados` | GET | Obtiene los submenus personalizados de un usuario |
| `/administracion/user_roles` | GET/POST | Formulario principal de asignacion de roles |

---

## Script SQL para Crear las Tablas

```sql
-- =====================================================
-- SISTEMA DE ROLES Y PERMISOS - SIRES
-- Base de datos: MySQL 8.0+
-- =====================================================

-- 1. TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS sy_usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(20) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    clave VARCHAR(300) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    nombre VARCHAR(45) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    paterno VARCHAR(45) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    materno VARCHAR(45) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    expediente VARCHAR(8) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    curp VARCHAR(45) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    img_perfil VARCHAR(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    correo VARCHAR(100) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
    est_usuario VARCHAR(1) NOT NULL,
    usr_alta VARCHAR(20) DEFAULT NULL,
    fch_alta DATETIME DEFAULT NULL,
    usr_modf VARCHAR(20) DEFAULT NULL,
    fch_modf DATETIME DEFAULT NULL,
    usr_baja VARCHAR(20) DEFAULT NULL,
    fch_baja DATETIME DEFAULT NULL,
    
    UNIQUE KEY usuario_UNIQUE (usuario),
    UNIQUE KEY expediente_UNIQUE (expediente),
    UNIQUE KEY curp_UNIQUE (curp),
    UNIQUE KEY correo_UNIQUE (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. CATALOGO DE ROLES
CREATE TABLE IF NOT EXISTS cat_roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    rol VARCHAR(50) NOT NULL,
    tp_rol VARCHAR(5) NOT NULL,
    desc_rol VARCHAR(200) NOT NULL,
    est_rol VARCHAR(1) NOT NULL,
    usr_alta VARCHAR(20) NOT NULL,
    fch_alta DATETIME DEFAULT NULL,
    usr_modf VARCHAR(20) DEFAULT NULL,
    fch_modf DATETIME DEFAULT NULL,
    usr_baja VARCHAR(20) DEFAULT NULL,
    fch_baja DATETIME DEFAULT NULL,
    
    UNIQUE KEY rol_UNIQUE (rol),
    UNIQUE KEY tp_rol_UNIQUE (tp_rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. CATALOGO DE MENUS
CREATE TABLE IF NOT EXISTS cat_menus (
    id_menu INT AUTO_INCREMENT PRIMARY KEY,
    menu VARCHAR(50) NOT NULL,
    desc_menu VARCHAR(200) NOT NULL,
    clave_search VARCHAR(1) NOT NULL,
    est_menu VARCHAR(1) NOT NULL,
    usr_alta VARCHAR(20) NOT NULL,
    fch_alta DATETIME DEFAULT NULL,
    usr_modf VARCHAR(20) DEFAULT NULL,
    fch_modf DATETIME DEFAULT NULL,
    usr_baja VARCHAR(20) DEFAULT NULL,
    fch_baja DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. CATALOGO DE SUBMENUS
CREATE TABLE IF NOT EXISTS cat_submenus (
    id_submenu INT AUTO_INCREMENT PRIMARY KEY,
    id_menu INT NOT NULL,
    submenu VARCHAR(50) NOT NULL,
    desc_submenu VARCHAR(200) NOT NULL,
    url VARCHAR(100) NOT NULL,
    est_submenu VARCHAR(1) NOT NULL DEFAULT 'A',
    usr_alta VARCHAR(20) NOT NULL,
    fch_alta DATETIME DEFAULT NULL,
    usr_modf VARCHAR(20) DEFAULT NULL,
    fch_modf DATETIME DEFAULT NULL,
    usr_baja VARCHAR(20) DEFAULT NULL,
    fch_baja DATETIME DEFAULT NULL,
    
    UNIQUE KEY consult_UNIQUE (id_menu, submenu),
    CONSTRAINT fk_submenu_menu FOREIGN KEY (id_menu) 
        REFERENCES cat_menus(id_menu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. ASIGNACION DE ROLES A USUARIOS
CREATE TABLE IF NOT EXISTS users_roles (
    id_usr_roles INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    tp_asignacion VARCHAR(10) NOT NULL COMMENT 'ROL o PERS (Personalizado)',
    est_usr_rol VARCHAR(1) NOT NULL,
    usr_alta VARCHAR(20) NOT NULL,
    fch_alta DATETIME NOT NULL,
    usr_modf VARCHAR(20) DEFAULT NULL,
    fch_modf DATETIME DEFAULT NULL,
    usr_baja VARCHAR(20) DEFAULT NULL,
    fch_baja DATETIME DEFAULT NULL,
    
    UNIQUE KEY uq_usuario_rol (id_usuario, id_rol),
    CONSTRAINT fk_usrroles_usuario FOREIGN KEY (id_usuario) 
        REFERENCES sy_usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_usrroles_rol FOREIGN KEY (id_rol) 
        REFERENCES cat_roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. DETALLE DE PERMISOS POR ROL
CREATE TABLE IF NOT EXISTS det_roles (
    id_detrol INT AUTO_INCREMENT PRIMARY KEY,
    id_rol INT NOT NULL,
    id_menu INT NOT NULL,
    id_submenu INT NOT NULL,
    est_detrol VARCHAR(1) NOT NULL,
    usr_alta VARCHAR(20) NOT NULL,
    fch_alta DATETIME NOT NULL,
    usr_modf VARCHAR(20) DEFAULT NULL,
    fch_modf DATETIME DEFAULT NULL,
    usr_baja VARCHAR(20) DEFAULT NULL,
    fch_baja DATETIME DEFAULT NULL,
    
    UNIQUE KEY uq_rol_menu_submenu (id_rol, id_menu, id_submenu),
    CONSTRAINT fk_detrol_rol FOREIGN KEY (id_rol) 
        REFERENCES cat_roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detrol_menu FOREIGN KEY (id_menu) 
        REFERENCES cat_menus(id_menu) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detrol_submenu FOREIGN KEY (id_submenu) 
        REFERENCES cat_submenus(id_submenu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. PERMISOS PERSONALIZADOS POR USUARIO
CREATE TABLE IF NOT EXISTS det_roles_personalizados (
    id_detpersonalizado INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    id_menu INT NOT NULL,
    id_submenu INT NOT NULL,
    tp_asignacion VARCHAR(10) NOT NULL COMMENT 'Ej. "ROL" o "0-usuario"',
    est_detpersonalizado VARCHAR(1) NOT NULL COMMENT 'A=Activo, B=Inactivo',
    usr_alta VARCHAR(20) NOT NULL,
    fch_alta DATETIME NOT NULL,
    usr_modf VARCHAR(20) DEFAULT NULL,
    fch_modf DATETIME DEFAULT NULL,
    usr_baja VARCHAR(20) DEFAULT NULL,
    fch_baja DATETIME DEFAULT NULL,
    
    CONSTRAINT fk_detpers_usuario FOREIGN KEY (id_usuario) 
        REFERENCES sy_usuarios(id_usuario) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detpers_rol FOREIGN KEY (id_rol) 
        REFERENCES cat_roles(id_rol) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detpers_menu FOREIGN KEY (id_menu) 
        REFERENCES cat_menus(id_menu) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_detpers_submenu FOREIGN KEY (id_submenu) 
        REFERENCES cat_submenus(id_submenu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Roles base del sistema
INSERT INTO cat_roles (rol, tp_rol, desc_rol, est_rol, usr_alta, fch_alta) VALUES
('ADMINISTRADOR', 'ADMIN', 'Acceso total al sistema', 'A', 'system', NOW()),
('MEDICO', 'MED', 'Acceso a modulos de consulta medica', 'A', 'system', NOW()),
('RECEPCION', 'REC', 'Acceso a modulos de recepcion', 'A', 'system', NOW()),
('FARMACIA', 'FARM', 'Acceso a modulos de farmacia', 'A', 'system', NOW()),
('PERSONALIZADO', 'PERS', 'Permisos personalizados por usuario', 'A', 'system', NOW());

-- Menus base
INSERT INTO cat_menus (menu, desc_menu, clave_search, est_menu, usr_alta, fch_alta) VALUES
('CATALOGOS', 'Catalogos del sistema', 'C', 'A', 'system', NOW()),
('HERRAMIENTAS', 'Herramientas de administracion', 'H', 'A', 'system', NOW()),
('ADMINISTRACION', 'Administracion del sistema', 'A', 'A', 'system', NOW()),
('CONSULTA MEDICA', 'Modulos de consulta medica', 'M', 'A', 'system', NOW()),
('RECEPCION', 'Modulos de recepcion', 'R', 'A', 'system', NOW()),
('FARMACIA', 'Modulos de farmacia', 'F', 'A', 'system', NOW());
```

---

## Notas de Seguridad y Mejoras Recomendadas

### Vulnerabilidades Identificadas

| Problema | Descripcion | Ubicacion |
|----------|-------------|-----------|
| Endpoints AJAX sin proteccion | `/buscar_usuario`, `/buscar_rol` no tienen `@login_required` | routes.py |
| Sin decoradores de rol | No existe decorador `@requires_role('ADMIN')` | Todo el proyecto |
| Usuario hardcodeado | En algunos lugares `usr_alta="admin"` | routes.py |

### Mejoras Recomendadas

1. **Crear decorador personalizado de roles:**

```python
from functools import wraps
from flask import abort, redirect, url_for
from flask_login import current_user

def requires_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('users.login'))
            
            user_roles = UserRoles.query.filter_by(
                id_usuario=current_user.id_usuario,
                est_usr_rol='A'
            ).all()
            
            user_role_names = [ur.rol.rol.upper() for ur in user_roles if ur.rol]
            
            if not any(role.upper() in user_role_names for role in roles):
                abort(403)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Uso:
@administracion_bp.route('/user_roles')
@requires_role('ADMINISTRADOR')
def user_roles():
    pass
```

2. **Agregar `@login_required` a endpoints AJAX**

3. **Implementar logging de cambios de permisos**

4. **Centralizar la logica de `before_request`** en un solo lugar

---

## Archivos Principales del Sistema

| Archivo | Proposito |
|---------|-----------|
| `app/__init__.py` | Actualizacion automatica de permisos cada 60s |
| `app/models/users.py` | Modelo SyUsuarios, DetUsuarios, BitAccesos |
| `app/models/administracion.py` | Modelo UserRoles, DetRolesPersonalizados |
| `app/models/herramientas.py` | Modelo DetRoles |
| `app/models/catalogos.py` | Modelo CatRoles, CatMenus, CatSubMenus |
| `app/modules/users/utils_users.py` | obtener_permisos_usuario() |
| `app/modules/users/routes.py` | Login, actualizar_permisos_en_sesion() |
| `app/modules/administracion/routes.py` | CRUD de asignacion de roles, endpoints AJAX |
| `app/modules/herramientas/routes.py` | CRUD de det_roles |

---

## Autor

Documentacion generada automaticamente analizando el codigo fuente del proyecto SIRES.

**Fecha de generacion:** 2024-12-29
