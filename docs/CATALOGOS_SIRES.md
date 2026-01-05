# Sistema de Catálogos - SIRES

## Descripción General

El sistema de catálogos de SIRES es una arquitectura centralizada para la gestión de **datos maestros** del sistema médico. Los catálogos funcionan como **tablas de referencia** que normalizan la información y evitan la duplicidad de datos en todo el sistema.

---

## Arquitectura del Sistema de Catálogos

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                         │
│    app/templates/catalogos/*.html (38 templates HTML)               │
│    app/static/js/*.js (archivos JavaScript para UI)                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                       CAPA DE FORMULARIOS                           │
│    app/modules/catalogos/forms.py (WTForms - validación)            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                          CAPA DE RUTAS                              │
│    app/modules/catalogos/routes.py (Flask Blueprints)               │
│    Blueprint: catalogos_bp → URL prefix: /catalogos                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                         CAPA DE MODELOS                             │
│    app/models/catalogos.py (SQLAlchemy ORM - 40 modelos)            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                     CAPA DE BASE DE DATOS                           │
│    MySQL - Procedimientos Almacenados (sp_menu_cat_*)               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Ubicación de Archivos

| Componente | Ruta | Descripción |
|------------|------|-------------|
| **Modelos** | `app/models/catalogos.py` | Definiciones ORM de las 40 tablas de catálogos |
| **Rutas** | `app/modules/catalogos/routes.py` | Endpoints HTTP (~2500+ líneas) |
| **Formularios** | `app/modules/catalogos/forms.py` | Validación WTForms (356 líneas) |
| **Templates** | `app/templates/catalogos/*.html` | 38 templates HTML |
| **JavaScript** | `app/static/js/catalogos.js` | Lógica frontend |
| **Extensiones** | `app/extensions.py` | Configuración SQLAlchemy (db) |

---

## Listado Completo de Catálogos (40 modelos)

### Catálogos del Sistema

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `CatMenus` | `cat_menus` | Menús del sistema de navegación |
| `CatSubMenus` | `cat_submenus` | Submenús del sistema (relacionado con CatMenus) |
| `CatRoles` | `cat_roles` | Roles de usuario del sistema |

### Catálogos Médicos

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `CatClinicas` | `cat_clinicas` | Clínicas/unidades médicas |
| `CatConsultorios` | `cat_consultorios` | Consultorios médicos |
| `CatEspecialidades` | `cat_especialidades` | Especialidades médicas |
| `CatTurnos` | `cat_turnos` | Turnos de trabajo (matutino, vespertino, nocturno) |
| `CatServiciosClin` | `cat_serviciosclin` | Servicios clínicos |
| `CatMedicosClin` | `cat_medicosclin` | Médicos de clínica |
| `CatMedicosEspecHosp` | `cat_medicosespechosp` | Médicos especialistas de hospital |
| `CatHospitales` | `cat_hospitales` | Hospitales de referencia |
| `CatLaboratorios` | `cat_laboratorios` | Laboratorios clínicos |
| `CatEstudiosMed` | `cat_estudiosmed` | Estudios médicos (laboratorio/gabinete) |

### Catálogos de Diagnósticos

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `CatEnfermedades` | `cat_enfermedades` | Enfermedades registradas |
| `CatCIE10` | `cat_cie10` | Clasificación Internacional de Enfermedades v10 |
| `CatCIE11` | `cat_cie11` | Clasificación Internacional de Enfermedades v11 |
| `CatCies` | `cat_cies` | Versiones CIE disponibles |

### Catálogos de Pacientes

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `CatEdoCivil` | `cat_edocivil` | Estados civiles |
| `CatEscolaridad` | `cat_escolaridad` | Niveles de escolaridad |
| `CatOcupaciones` | `cat_ocupaciones` | Ocupaciones laborales |
| `CatParentescos` | `cat_parentescos` | Parentescos familiares |
| `CatTpSanguineo` | `cat_tpsanguineo` | Tipos sanguíneos |

### Catálogos de Farmacia

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `CatMedicamentos` | `cat_medicamentos` | Medicamentos del cuadro básico |
| `CatGpoMedic` | `cat_gpomedic` | Grupos de medicamentos |

### Catálogos Administrativos

| Modelo | Tabla | Descripción |
|--------|-------|-------------|
| `CatEscuelas` | `cat_escuelas` | Instituciones educativas médicas |
| `CatTipoConsulta` | `cat_tipo_consulta` | Tipos de consulta médica |
| `CatTipoHospn` | `cat_tipo_hospn` | Tipos de hospitalización |
| `CatOrigenCons` | `cat_origencons` | Origen de la consulta |
| `CatCalidadLab` | `cat_calidadlab` | Calidad laboral de trabajadores |
| `CatTpCitas` | `cat_tpcitas` | Tipos de citas médicas |
| `CatPases` | `cat_pases` | Pases médicos |
| `CatTipoLicencia` | `cat_tplicencia` | Tipos de licencias médicas |
| `CatTpAutorizacion` | `cat_tpautorizacion` | Tipos de autorización |
| `CatTpAutorizador` | `cat_tpautorizador` | Tipos de autorizadores |
| `CatAutorizadores` | `cat_autorizadores` | Autorizadores de trámites |
| `CatTpAreas` | `cat_tpareas` | Tipos de áreas |
| `CatAreas` | `cat_areas` | Áreas organizacionales |
| `CatTpBajas` | `cat_tpbajas` | Tipos de bajas |

---

## Estructura Común de los Modelos

Todos los catálogos siguen un **patrón de auditoría consistente** con los siguientes campos:

```python
class CatXXX(db.Model):
    __tablename__ = 'cat_xxx'

    # Campo ID (PK)
    id_xxx = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # Campo principal del catálogo
    xxx = db.Column(db.String(N), unique=True, nullable=False)
    
    # Estado del registro ('A' = Activo, 'I' = Inactivo)
    est_xxx = db.Column(db.String(1), nullable=False, default='A')
    
    # === CAMPOS DE AUDITORÍA ===
    usr_alta = db.Column(db.String(20), default=None)      # Usuario que creó
    fch_alta = db.Column(db.DateTime, default=None)        # Fecha de creación
    usr_modf = db.Column(db.String(20), default=None)      # Usuario que modificó
    fch_modf = db.Column(db.DateTime, default=None)        # Fecha de modificación
    usr_baja = db.Column(db.String(20), default=None)      # Usuario que dio de baja
    fch_baja = db.Column(db.DateTime, default=None)        # Fecha de baja
```

---

## Flujo de Operaciones CRUD

El sistema utiliza **procedimientos almacenados** en MySQL para todas las operaciones CRUD. Cada catálogo tiene su procedimiento correspondiente:

### Patrón de Nomenclatura
```
sp_menu_cat_{nombre_catalogo}
```

### Ejemplo de Llamada (desde routes.py)
```python
result = db.session.execute(
    text("CALL sp_menu_cat_turnos(:ve_opcion, :ve_id_trno, :ve_turno, :ve_id_usr, @vs_id_trno, @vs_resp, @vs_dsc_resp, @vs_bool_resp)"),
    {
        've_opcion': opcion,      # Operación: ALTA, BAJA, MODIF, CONSUL
        've_id_trno': id_trno,    # ID del registro
        've_turno': turno,        # Valor del catálogo
        've_id_usr': id_usr       # Usuario que realiza la operación
    }
)
db.session.commit()

# Parámetros de salida del SP:
# @vs_id_trno    → ID generado/afectado
# @vs_resp       → Mensaje de respuesta
# @vs_dsc_resp   → Descripción detallada
# @vs_bool_resp  → 'true' / 'false' (éxito/error)
```

### Operaciones Soportadas

| Código | Operación | Descripción |
|--------|-----------|-------------|
| ALTA | Crear | Inserta un nuevo registro |
| MODIF | Modificar | Actualiza un registro existente |
| BAJA | Eliminar | Cambia estatus a 'I' (baja lógica) |
| CONSUL | Consultar | Obtiene datos de un registro |

---

## Implementación en Otros Módulos

Los catálogos son consumidos en múltiples partes del sistema:

### 1. Módulo de Usuarios (`app/modules/users/`)

```python
# routes.py
from app.models.catalogos import CatSubMenus

# Obtener submenús activos para permisos
submenus_activos = CatSubMenus.query.filter_by(est_submenu='A').all()
```

```python
# forms.py
from app.models.catalogos import CatSubMenus, CatRoles

# Poblar select de roles
self.txtIdTpRol.choices = [(tiporol.tp_rol, tiporol.tp_rol) 
    for tiporol in CatRoles.query.filter_by(est_rol='A').order_by(CatRoles.tp_rol).all()]
```

```python
# utils_users.py
from app.models.catalogos import CatMenus, CatSubMenus

# Construir menú dinámico basado en permisos
submenus = CatSubMenus.query.filter_by(est_submenu='A').all()
menu = CatMenus.query.filter_by(id_menu=id_menu, est_menu='A').first()
```

### 2. Módulo de Herramientas (`app/modules/herramientas/`)

```python
# routes.py
from app.models.catalogos import CatRoles, CatMenus, CatSubMenus

# Gestión de roles y permisos
rol = CatRoles.query.filter_by(id_rol=rol_id, est_rol='A').first()
roles = [(str(rol.id_rol), rol.rol) for rol in CatRoles.query.filter_by(est_rol='A').all()]
```

### 3. Módulo de Administración (`app/modules/administracion/`)

```python
# routes.py
from app.models.catalogos import CatRoles, CatSubMenus, CatMenus

# Administración de accesos
```

---

## Relaciones Entre Catálogos

### CatMenus ↔ CatSubMenus (1:N)
```python
class CatSubMenus(db.Model):
    id_menu = db.Column(db.Integer, db.ForeignKey('cat_menus.id_menu'), nullable=False)
    menu_rel = db.relationship('CatMenus', backref=db.backref('submenus', lazy=True))
    
    @property
    def nombre_menu(self):
        return self.menu_rel.menu if self.menu_rel else ''
```

### CatAreas → CatTpAreas (N:1)
```python
class CatAreas(db.Model):
    id_tparea = db.Column(db.Integer, nullable=False)
    tparea = db.Column(db.String(50), nullable=False)  # Desnormalizado
```

### CatConsultorios → CatTurnos + CatClinicas (N:1, N:1)
```python
class CatConsultorios(db.Model):
    id_trno = db.Column(db.Integer, nullable=False)
    turno = db.Column(db.String(45), nullable=False)   # Desnormalizado
    id_clin = db.Column(db.Integer, nullable=False)
    clinica = db.Column(db.String(45), nullable=False) # Desnormalizado
```

### CatMedicosClin (Múltiples relaciones)
```python
class CatMedicosClin(db.Model):
    id_usuario = db.Column(db.Integer)      → SyUsuarios
    id_esc = db.Column(db.Integer)          → CatEscuelas
    id_espec = db.Column(db.Integer)        → CatEspecialidades
    id_serviciosclin = db.Column(db.Integer)→ CatServiciosClin
    id_clin = db.Column(db.Integer)         → CatClinicas
    id_consult = db.Column(db.Integer)      → CatConsultorios
    id_consult2 = db.Column(db.Integer)     → CatConsultorios (opcional, segundo turno)
```

---

## Seguridad y Control de Acceso

### Protección de Rutas
```python
@catalogos_bp.before_request
def proteger_rutas_administracion():
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))

    urls_nopermitidas = session.get('urls_nopermitidas', [])
    current_path = urlparse(request.path).path.lower()

    if any(current_path == urlparse(url).path.lower() for url in urls_nopermitidas):
        abort(403)
```

---

## Endpoints de Catálogos

Todos los catálogos están disponibles bajo el prefijo `/catalogos`:

| Endpoint | Modelo | Descripción |
|----------|--------|-------------|
| `/catalogos/cat_menus` | CatMenus | Gestión de menús |
| `/catalogos/cat_submenus` | CatSubMenus | Gestión de submenús |
| `/catalogos/cat_clinicas` | CatClinicas | Gestión de clínicas |
| `/catalogos/cat_especialidades` | CatEspecialidades | Gestión de especialidades |
| `/catalogos/cat_escuelas` | CatEscuelas | Gestión de escuelas |
| `/catalogos/cat_turnos` | CatTurnos | Gestión de turnos |
| `/catalogos/cat_enfermedades` | CatEnfermedades | Gestión de enfermedades |
| `/catalogos/cat_escolaridad` | CatEscolaridad | Gestión de escolaridad |
| `/catalogos/cat_tipo_consulta` | CatTipoConsulta | Tipos de consulta |
| `/catalogos/cat_cie10` | CatCIE10 | Códigos CIE-10 |
| `/catalogos/cat_cie11` | CatCIE11 | Códigos CIE-11 |
| `/catalogos/cat_tipo_hospn` | CatTipoHospn | Tipos de hospitalización |
| `/catalogos/cat_calidadlab` | CatCalidadLab | Calidad laboral |
| `/catalogos/cat_edocivil` | CatEdoCivil | Estados civiles |
| `/catalogos/cat_tpsanguineo` | CatTpSanguineo | Tipos sanguíneos |
| `/catalogos/cat_gpomedic` | CatGpoMedic | Grupos de medicamentos |
| `/catalogos/cat_hospitales` | CatHospitales | Hospitales |
| `/catalogos/cat_origencons` | CatOrigenCons | Origen de consulta |
| `/catalogos/cat_ocupaciones` | CatOcupaciones | Ocupaciones |
| `/catalogos/cat_parentescos` | CatParentescos | Parentescos |
| `/catalogos/cat_laboratorios` | CatLaboratorios | Laboratorios |
| `/catalogos/cat_tplicencia` | CatTipoLicencia | Tipos de licencia |
| `/catalogos/cat_tpautorizacion` | CatTpAutorizacion | Tipos de autorización |
| `/catalogos/cat_tpcitas` | CatTpCitas | Tipos de citas |
| `/catalogos/cat_pases` | CatPases | Pases médicos |
| `/catalogos/cat_serviciosclin` | CatServiciosClin | Servicios clínicos |
| `/catalogos/cat_estudiosmed` | CatEstudiosMed | Estudios médicos |
| `/catalogos/cat_consultorios` | CatConsultorios | Consultorios |
| `/catalogos/cat_tpareas` | CatTpAreas | Tipos de áreas |
| `/catalogos/cat_areas` | CatAreas | Áreas |
| `/catalogos/cat_tpbajas` | CatTpBajas | Tipos de bajas |
| `/catalogos/cat_cies` | CatCies | Versiones CIE |
| `/catalogos/cat_tpautorizador` | CatTpAutorizador | Tipos de autorizador |
| `/catalogos/cat_autorizadores` | CatAutorizadores | Autorizadores |
| `/catalogos/cat_medicosclin` | CatMedicosClin | Médicos de clínica |
| `/catalogos/cat_medicosespechosp` | CatMedicosEspecHosp | Médicos especialistas |
| `/catalogos/cat_roles` | CatRoles | Roles del sistema |
| `/catalogos/cat_medicamentos` | CatMedicamentos | Medicamentos |

---

## Archivos JavaScript Relacionados

| Archivo | Descripción |
|---------|-------------|
| `app/static/js/catalogos.js` | Lógica general de catálogos |
| `app/static/js/clinicas.js` | Lógica específica para clínicas |
| `app/static/js/consultorios.js` | Lógica específica para consultorios |
| `app/static/js/enfermedades.js` | Lógica específica para enfermedades |
| `app/static/js/escuelas.js` | Lógica específica para escuelas |
| `app/static/js/especialidades.js` | Lógica específica para especialidades |
| `app/static/js/herramientas.js` | Herramientas auxiliares |
| `app/static/js/turnos.js` | Lógica específica para turnos |
| `app/static/js/areas.js` | Lógica específica para áreas |

---

## Resumen de Implementación

### Flujo Completo de un Catálogo

```
1. Usuario accede a /catalogos/cat_xxx
         │
         ▼
2. routes.py → cat_xxx() maneja GET/POST
         │
         ├── GET: Consulta modelo CatXxx.query.all()
         │         Renderiza template cat_xxx.html
         │
         └── POST: Valida formulario XxxForm
                   │
                   ▼
              Llama sp_menu_cat_xxx via db.session.execute()
                   │
                   ▼
              Procesa respuesta del SP
                   │
                   ├── Éxito: flash('success') + redirect
                   │
                   └── Error: flash('error') + guarda datos en session
                              para repoblar formulario
```

### Scripts que Usan Catálogos

| Script | Catálogos que Usa |
|--------|-------------------|
| `app/modules/users/routes.py` | CatSubMenus |
| `app/modules/users/forms.py` | CatSubMenus, CatRoles |
| `app/modules/users/utils_users.py` | CatMenus, CatSubMenus |
| `app/modules/herramientas/routes.py` | CatRoles, CatMenus, CatSubMenus |
| `app/modules/herramientas/forms.py` | CatRoles |
| `app/modules/administracion/routes.py` | CatRoles, CatSubMenus, CatMenus |
| `app/modules/administracion/forms.py` | Todos (*) |
| `utils.py` | CatMenus, CatSubMenus |

---

## Notas Importantes

1. **Baja Lógica**: Los registros nunca se eliminan físicamente. Se cambia `est_xxx` a 'I' (Inactivo).

2. **Desnormalización**: Algunos catálogos guardan el valor descriptivo además del ID para optimizar consultas.

3. **Procedimientos Almacenados**: Toda la lógica de negocio está en MySQL, no en Python.

4. **Auditoría Completa**: Cada registro tiene trazabilidad de quién y cuándo lo creó/modificó/eliminó.

5. **WTForms + jQuery**: La validación se hace en cliente (JS) y servidor (WTForms).

---

*Documento generado para SIRES - Sistema de Información de Residentes y Especialistas*  
*Última actualización: Diciembre 2024*
