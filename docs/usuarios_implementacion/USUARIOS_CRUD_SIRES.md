# CRUD de Usuarios - SIRES

## Descripción General

El módulo de usuarios maneja la **autenticación**, **autorización** y **gestión de usuarios** del sistema SIRES. Incluye funcionalidades de login, recuperación de contraseña, gestión de permisos y bitácora de accesos.

---

## Arquitectura del Módulo de Usuarios

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                         │
│    templates/auth/*.html (4 templates)                              │
│    templates/menu.html (layout base)                                │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                       CAPA DE FORMULARIOS                           │
│    modules/users/forms.py (WTForms - validación)                    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                          CAPA DE RUTAS                              │
│    modules/users/routes.py (Flask Blueprints)                       │
│    Blueprint: users_bp → URL prefix: /usuarios                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                         CAPA DE MODELOS                             │
│    models/users.py (SQLAlchemy ORM - 4 modelos)                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                     CAPA DE BASE DE DATOS                           │
│    MySQL - Procedimientos Almacenados (sp_menu_sy_*, sp_menu_admin_*)│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Ubicación de Archivos

| Componente | Ruta | Descripción |
|------------|------|-------------|
| **Modelos** | `app/models/users.py` | Definiciones ORM (4 modelos) |
| **Rutas** | `app/modules/users/routes.py` | Endpoints HTTP (~1000 líneas) |
| **Formularios** | `app/modules/users/forms.py` | Validación WTForms |
| **Utilidades** | `app/modules/users/utils_users.py` | Funciones de permisos |
| **Templates** | `app/templates/auth/*.html` | 4 templates HTML |
| **Extensiones** | `app/extensions.py` | Configuración SQLAlchemy/Flask-Login |

---

## Modelos de Datos

### 1. SyUsuarios (Tabla principal)

```python
class SyUsuarios(db.Model, UserMixin):
    __tablename__ = 'sy_usuarios'

    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario = db.Column(db.String(20))          # Login username
    clave = db.Column(db.String(300))           # Contraseña hasheada
    nombre = db.Column(db.String(45))           # Nombre
    paterno = db.Column(db.String(45))          # Apellido paterno
    materno = db.Column(db.String(45))          # Apellido materno
    expediente = db.Column(db.String(8))        # Número de expediente (único)
    curp = db.Column(db.String(45))             # CURP (único)
    img_perfil = db.Column(db.String(100))      # Imagen de perfil
    correo = db.Column(db.String(100))          # Correo electrónico (único)
    est_usuario = db.Column(db.String(1))       # Estado: 'A' activo, 'I' inactivo
    
    # Campos de auditoría
    usr_alta = db.Column(db.String(20))
    fch_alta = db.Column(db.DateTime)
    usr_modf = db.Column(db.String(20))
    fch_modf = db.Column(db.DateTime)
    usr_baja = db.Column(db.String(20))
    fch_baja = db.Column(db.DateTime)
```

### 2. DetUsuarios (Detalles de sesión)

```python
class DetUsuarios(db.Model):
    __tablename__ = 'det_usuarios'

    id_detusr = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer)          # FK a sy_usuarios
    terminos_acept = db.Column(db.String(1))    # Términos aceptados S/N
    last_conexion = db.Column(db.DateTime)      # Última conexión
    act_conexion = db.Column(db.DateTime)       # Conexión actual
    token = db.Column(db.String(300))           # Token de recuperación
    vida_token = db.Column(db.DateTime)         # Expiración del token
    cambiar_clave = db.Column(db.String(1))     # Forzar cambio de clave S/N
    ip_ultima = db.Column(db.String(45))        # Última IP
```

### 3. AdminSubmenus (Permisos por rol)

```python
class AdminSubmenus(db.Model):
    __tablename__ = 'admin_submenus'

    id_adminsubmenu = db.Column(db.Integer, primary_key=True)
    id_submenu = db.Column(db.Integer)          # FK a cat_submenus
    submenu = db.Column(db.String(50))          # Nombre del submenú
    id_rol = db.Column(db.Integer)              # FK a cat_roles
    tp_rol = db.Column(db.String(50))           # Tipo de rol
    est_adminsubmenu = db.Column(db.String(1))  # Estado A/I
    
    # Campos de auditoría
    usr_alta, fch_alta, usr_modf, fch_modf, usr_baja, fch_baja
```

### 4. BitAccesos (Bitácora de accesos)

```python
class BitAccesos(db.Model):
    __tablename__ = 'bit_accesos'

    id_acceso = db.Column(db.Integer, primary_key=True)
    id_usuario = db.Column(db.Integer)          # FK a sy_usuarios
    ip_ultima = db.Column(db.String(45))        # IP del acceso
    conexion_act = db.Column(db.String(50))     # Tipo de conexión
    fecha_conexion = db.Column(db.DateTime)     # Fecha/hora del acceso
```

---

## CRUD de Usuarios

### Ubicación Exacta
```
app/modules/users/routes.py → líneas 748-830
```

### Ruta
```
GET/POST /usuarios/sy_usuarios
```

### Función: `sy_usuarios()`

```python
@users_bp.route('/sy_usuarios', methods=['GET', 'POST'])
def sy_usuarios():
    form = SyUsuariosForm()
    if request.method == 'POST':
        # Obtener datos del formulario
        opcion = form.opcion.data.upper()      # ALTA, MODIF, BAJA
        id_usuario = form.txtId.data
        usuario = form.txtUsuario.data
        nombre = form.txtNombre.data
        paterno = form.txtPaterno.data
        materno = form.txtMaterno.data
        expediente = form.txtExpediente.data
        curp = form.txtCurp.data
        img_perfil = form.txtImgPerfil.data
        correo = form.txtCorreo.data
        
        # Generar contraseña para nuevos usuarios
        nueva_clave = generate_code(8)
        hashed_clave = generate_password_hash(nueva_clave)
        
        # Llamar procedimiento almacenado
        result = db.session.execute(
            text("CALL sp_menu_sy_usuarios(...)"),
            {...}
        )
        
        # Si es ALTA (opcion 153), enviar correo con credenciales
        if opcion == "153":
            enviar_correo_token(correo, nombre, paterno, materno, nueva_clave, usuario)
    
    # GET: Mostrar lista de usuarios
    usuarios = SyUsuarios.query.all()
    return render_template('auth/sy_usuarios.html', form=form, usuarios=usuarios)
```

### Procedimiento Almacenado
```sql
CALL sp_menu_sy_usuarios(
    :ve_opcion,        -- 'ALTA', 'MODIF', 'BAJA', '153' (alta con correo)
    :ve_id_usuario,    -- ID del usuario
    :ve_usuario,       -- Username
    :ve_clave,         -- Password hasheado
    :ve_nombre,        -- Nombre
    :ve_paterno,       -- Apellido paterno
    :ve_materno,       -- Apellido materno
    :ve_expediente,    -- Número de expediente
    :ve_curp,          -- CURP
    :ve_img_perfil,    -- Ruta imagen perfil
    :ve_correo,        -- Email
    :ve_id_usr,        -- Usuario que ejecuta
    @vs_id_usuario,    -- OUT: ID generado
    @vs_resp,          -- OUT: Mensaje respuesta
    @vs_dsc_resp,      -- OUT: Descripción
    @vs_bool_resp      -- OUT: 'true'/'false'
)
```

---

## CRUD de Permisos (AdminSubmenus)

### Ubicación Exacta
```
app/modules/users/routes.py → líneas 832-887
```

### Ruta
```
GET/POST /usuarios/admin_submenus
```

### Función: `admin_submenus()`

```python
@users_bp.route('/admin_submenus', methods=['GET', 'POST'])
def admin_submenus():
    form = AdminSubmenusForm()
    if request.method == 'POST':
        opcion = form.opcion.data.upper()
        id_adminsubmenu = form.txtId.data
        submenu = form.txtIdSubmenu.data
        tp_rol = form.txtIdTpRol.data
        
        result = db.session.execute(
            text("CALL sp_menu_admin_submenus(...)"),
            {...}
        )
    
    adminsubmenus = AdminSubmenus.query.all()
    return render_template('auth/admin_submenus.html', form=form, adminsubmenus=adminsubmenus)
```

---

## Endpoints Completos del Módulo

| Ruta | Método | Función | Descripción |
|------|--------|---------|-------------|
| `/usuarios/` | GET/POST | `login()` | Inicio de sesión |
| `/usuarios/logout` | GET/POST | `logout()` | Cerrar sesión |
| `/usuarios/inicio` | GET/POST | `inicio()` | Página de inicio |
| `/usuarios/sy_usuarios` | GET/POST | `sy_usuarios()` | **CRUD de usuarios** |
| `/usuarios/admin_submenus` | GET/POST | `admin_submenus()` | **CRUD de permisos** |
| `/usuarios/aceptar_terminos` | POST | `aceptar_terminos()` | Aceptar términos |
| `/usuarios/solicitar_cambio_contrasena` | GET/POST | `solicitar_cambio_contrasena()` | Solicitar recuperación |
| `/usuarios/validar_codigo` | GET/POST | `validar_codigo()` | Validar token |
| `/usuarios/cambiar_contrasena/<curp>` | GET/POST | `cambiar_contrasena()` | Cambiar contraseña |
| `/usuarios/bitacora_equipos` | GET | `bitacora_equipos()` | Ver bitácora |

---

## Sistema de Permisos

### Flujo de Permisos

```
1. Usuario inicia sesión
         │
         ▼
2. Se obtienen permisos del usuario
   utils_users.py → obtener_permisos_usuario(id_usuario)
         │
         ▼
3. Se construye menú dinámico basado en:
   - Rol del usuario (CatRoles)
   - Submenús permitidos (AdminSubmenus)
   - Menús activos (CatMenus, CatSubMenus)
         │
         ▼
4. Se guardan permisos en session
   session['permisos'] = {...}
   session['urls_nopermitidas'] = [...]
         │
         ▼
5. En cada request se valida acceso
   @before_request → verificar_acceso_usuario()
```

### Función de Permisos (utils_users.py)

```python
def obtener_permisos_usuario(id_usuario):
    """
    Obtiene los permisos de un usuario basándose en su rol.
    Retorna estructura de menús y submenús permitidos.
    """
    # Obtener rol del usuario
    # Obtener submenús permitidos para ese rol
    # Construir estructura de menú
    return {
        'menus': [...],
        'submenus': [...],
        'urls_permitidas': [...],
        'urls_nopermitidas': [...]
    }
```

---

## Templates

| Template | Descripción |
|----------|-------------|
| `auth/sy_usuarios.html` | Formulario CRUD de usuarios |
| `auth/admin_submenus.html` | Formulario CRUD de permisos |
| `auth/login.html` | Página de login |
| `auth/bitacora_equipo.html` | Bitácora de accesos |
| `menu.html` | Layout base con menú dinámico |
| `mensajes.html` | Componente de flash messages |

---

## Seguridad

### Hashing de Contraseñas
```python
from werkzeug.security import generate_password_hash, check_password_hash

# Al crear/modificar usuario
hashed_clave = generate_password_hash(nueva_clave)

# Al verificar login
user.verify_password(password)  # Usa check_password_hash internamente
```

### Protección de Rutas
```python
@users_bp.before_request
def verificar_acceso_usuario():
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))
    
    urls_nopermitidas = session.get('urls_nopermitidas', [])
    if request.path in urls_nopermitidas:
        abort(403)
```

### Flask-Login
```python
# Configuración en __init__.py
login_manager.login_view = 'users.login'

@login_manager.user_loader
def load_user(user_id):
    return SyUsuarios.query.get(int(user_id))
```

---

## Relación con Catálogos

El módulo de usuarios consume los siguientes catálogos:

| Catálogo | Uso |
|----------|-----|
| `CatRoles` | Roles disponibles para asignar a usuarios |
| `CatMenus` | Menús del sistema para construir navegación |
| `CatSubMenus` | Submenús para asignar permisos |

---

## Flujo de Creación de Usuario

```
1. Admin accede a /usuarios/sy_usuarios
         │
         ▼
2. Llena formulario con datos del usuario
   - usuario, nombre, apellidos
   - expediente, CURP, correo
         │
         ▼
3. Sistema genera contraseña aleatoria (8 caracteres)
         │
         ▼
4. Llama sp_menu_sy_usuarios con opción '153' (ALTA)
         │
         ▼
5. Si éxito → Envía correo con credenciales
   Si error envío → Muestra contraseña en pantalla
         │
         ▼
6. Usuario recibe correo y puede iniciar sesión
         │
         ▼
7. Al primer login → Acepta términos y condiciones
         │
         ▼
8. Sistema registra en det_usuarios y bit_accesos
```

---

*Documento generado para SIRES - Sistema de Información de Residentes y Especialistas*  
*Última actualización: Diciembre 2024*
