from app.extensions import db
from datetime import datetime

class CatSubMenus(db.Model):
    __tablename__ = 'cat_submenus'

    id_submenu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_menu = db.Column(db.Integer, db.ForeignKey('cat_menus.id_menu'), nullable=False)
    submenu = db.Column(db.String(50), nullable=False)
    desc_submenu = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(100), nullable=False)
    est_submenu = db.Column(db.String(1), nullable=False, default='A')
    usr_alta = db.Column(db.String(20), nullable=False)
    fch_alta = db.Column(db.DateTime)
    usr_modf = db.Column(db.String(20))
    fch_modf = db.Column(db.DateTime)
    usr_baja = db.Column(db.String(20))
    fch_baja = db.Column(db.DateTime)

    __table_args__ = (
        db.UniqueConstraint('id_menu', 'submenu', name='consult_UNIQUE'),
    )

    # Relación con el modelo CatMenus
    menu_rel = db.relationship('CatMenus', backref=db.backref('submenus', lazy=True))

    # Retorna el nombre del menú (si se necesita para mostrar)
    @property
    def nombre_menu(self):
        return self.menu_rel.menu if self.menu_rel else '' 

class CatMenus(db.Model):
    __tablename__ = 'cat_menus'

    id_menu = db.Column(db.Integer, primary_key=True, autoincrement=True)
    menu = db.Column(db.String(50), nullable=False, default=None)
    desc_menu = db.Column(db.String(200), nullable=False, default=None)
    clave_search = db.Column(db.String(1), nullable=False, default=None)
    est_menu = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), nullable=False, default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatEscuelas(db.Model):
    __tablename__ = 'cat_escuelas'

    id_esc = db.Column(db.Integer, primary_key=True, autoincrement=True)
    escuela = db.Column(db.String(100), unique=True, nullable=False, default=None)
    sigls_esc = db.Column(db.String(45), nullable=False, default=None)
    est_esc = db.Column(db.String(1), nullable=False, default=None, comment='Estatus de la escuela')
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf  = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)


class CatEspecialidades(db.Model):
    __tablename__ = 'cat_especialidades'

    id_espec = db.Column(db.Integer, primary_key=True, autoincrement=True)
    especialidad = db.Column(db.String(45), unique=True, default=None)
    est_espec = db.Column(db.String(1), nullable=False, default=None, comment='Estatus de la especialidad médica')
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatTurnos(db.Model):
    __tablename__ = 'cat_turnos'

    id_trno = db.Column(db.Integer, primary_key=True, autoincrement=True)
    turno = db.Column(db.String(45), unique=True, default=None)
    est_trno = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatClinicas(db.Model):
    __tablename__ = 'cat_clinicas'

    id_clin = db.Column(db.Integer, primary_key=True, autoincrement=True)
    clinica = db.Column(db.String(45), nullable=False, unique=True)
    folio_clin = db.Column(db.String(2), nullable=False, unique=True)
    interna = db.Column(db.String(1), nullable=False, comment='Indicador si la clínica pertenece o no al sistema')
    ht_mat = db.Column(db.String(8), default=None)
    ht_ves = db.Column(db.String(8), default=None)
    ht_noc = db.Column(db.String(8), default=None)
    est_clin = db.Column(db.String(1), nullable=False, comment='Estatus de la clínica')
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatEnfermedades(db.Model):
    __tablename__ = 'cat_enfermedades'

    id_enf = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cve_enf = db.Column(db.String(8), nullable=False, default=None)
    enfermedad = db.Column(db.String(400), unique=True, default=None)
    vers_cie = db.Column(db.String(5), nullable=False, unique=True)
    est_enf = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    _table_args_ = (
        db.UniqueConstraint('cve_enf', 'vers_cie', name='cve_enf_UNIQUE'),
    )
    _table_args_ = (
        db.UniqueConstraint('enfermedad', 'vers_cie', name='enfermedad_UNIQUE'),
    )

class CatEscolaridad(db.Model):
    __tablename__ = 'cat_escolaridad'

    id_escol = db.Column(db.Integer, primary_key=True, autoincrement=True)
    escolaridad = db.Column(db.String(45), unique=True, default=None)
    est_escol = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatTipoConsulta(db.Model):
    __tablename__ = 'cat_tipo_consulta'

    id_t_consul = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tipo_consulta = db.Column(db.String(100), unique=True, default=None)
    est_t_consul = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatCIE10(db.Model):
    __tablename__ = 'cat_cie10'

    id_cie10 = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cve_cie10 = db.Column(db.String(10), unique=True, default=None)
    desc_cie10 = db.Column(db.String(1000), unique=True, default=None)
    sexo = db.Column(db.String(10), default=None)
    id_espec = db.Column(db.Integer, default=None)
    est_cie10 = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatCIE11(db.Model):
    __tablename__ = 'cat_cie11'

    id_cie11 = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cve_cie11 = db.Column(db.String(10), unique=True, default=None)
    desc_cie11 = db.Column(db.String(1000), unique=True, default=None)
    sexo = db.Column(db.String(10), default=None)
    id_espec = db.Column(db.Integer, default=None)
    est_cie11 = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatTipoHospn(db.Model):
    __tablename__ = 'cat_tipo_hospn'

    id_t_hospn = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tipo_hospn = db.Column(db.String(100), unique=True, default=None)
    est_t_hospn = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    
class CatCalidadLab(db.Model):
    __tablename__ = 'cat_calidadlab'

    id_calidadlab = db.Column(db.String(2), primary_key=True, unique=True)
    calidadlab = db.Column(db.String(50), unique=True, default=None)
    est_calidadlab = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)


class CatEdoCivil(db.Model):
    __tablename__ = 'cat_edocivil'

    id_edocivil = db.Column(db.Integer, primary_key=True, autoincrement=True)
    edocivil = db.Column(db.String(45), unique=True, default=None)
    est_edocivil = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)


class CatTpSanguineo(db.Model):
    __tablename__ = 'cat_tpsanguineo'

    id_tpsanguineo = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tpsanguineo = db.Column(db.String(5), unique=True, default=None)
    est_tpsanguineo = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatGpoMedic(db.Model):
    __tablename__ = 'cat_gpomedic'

    id_gpomedic = db.Column(db.Integer, primary_key=True, autoincrement=True)
    gpomedic = db.Column(db.String(255), nullable=False, unique=True, default=None)
    est_gpomedic = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)


class CatHospitales(db.Model):
    __tablename__ = 'cat_hospitales'

    id_hosp = db.Column(db.Integer, primary_key=True, autoincrement=True)
    hospital = db.Column(db.String(100), nullable=False, unique=True, default=None)
    calle = db.Column(db.String(100), nullable=False, default=None)
    asenta = db.Column(db.String(100), nullable=False, default=None)
    cp = db.Column(db.String(5), nullable=False, default=None)
    municipio = db.Column(db.String(80), nullable=False, default=None)
    entidad_fed = db.Column(db.String(50), nullable=False, default=None)
    telefono = db.Column(db.String(40), nullable=False, default=None)
    est_hosp = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatOrigenCons(db.Model):
    __tablename__ = 'cat_origencons'

    id_origencons = db.Column(db.String(2), primary_key=True, unique=True)
    origencons = db.Column(db.String(100), unique=True, nullable=False, default=None)
    est_origencons = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)


class CatOcupaciones(db.Model):
    __tablename__ = 'cat_ocupaciones'

    id_ocupacion = db.Column(db.Integer, primary_key=True, unique=True, autoincrement=True)
    ocupacion = db.Column(db.String(45), unique=True, nullable=False, default=None)
    est_ocupacion = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)


class CatParentescos(db.Model):
    __tablename__ = 'cat_parentescos'

    id_parentesco = db.Column(db.String(2), primary_key=True, unique=True)
    parentesco = db.Column(db.String(45), unique=True, nullable=False, default=None)
    est_parentesco = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)


class CatLaboratorios(db.Model):
    __tablename__ = 'cat_laboratorios'

    id_lab = db.Column(db.Integer, primary_key=True, unique=True, autoincrement=True)
    laboratorio = db.Column(db.String(100), nullable=False, default=None)
    unidad_lab = db.Column(db.String(50), nullable=False, default=None)
    calle = db.Column(db.String(100), nullable=False)
    asenta = db.Column(db.String(100), nullable=False, default=None)
    cp = db.Column(db.String(5), nullable=False, default=None)
    municipio = db.Column(db.String(80), nullable=False, default=None)
    entidad_fed = db.Column(db.String(50), nullable=False, default=None)
    telefono = db.Column(db.String(40), nullable=False, default=None)
    est_lab = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    _table_args_ = (
        db.UniqueConstraint('laboratorio', 'unidad_lab', name='laboratorio_UNIQUE'),
    )

class CatTipoLicencia(db.Model):
    __tablename__ = 'cat_tplicencia'

    id_tplicencia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tplicencia = db.Column(db.String(100), nullable=False, unique=True, default=None)
    est_tplicencia = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatTpAutorizacion(db.Model):
    __tablename__ = 'cat_tpautorizacion'

    id_tpautorizacion = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cve_tpautorizacion = db.Column(db.String(2), unique=True, default=None)
    tpautorizacion = db.Column(db.String(100), unique=True, default=None)
    est_tpautorizacion = db.Column(db.String(1), default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatTpCitas(db.Model):
    __tablename__ = 'cat_tpcitas'

    id_tpcita = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tpcita = db.Column(db.String(30), nullable=False, unique=True, default=None)
    est_tpcita = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)    

class CatPases(db.Model):
    __tablename__ = 'cat_pases'

    id_pase = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pase = db.Column(db.String(50), nullable=False, unique=True, default=None)
    est_pase = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatServiciosClin(db.Model):
    __tablename__ = 'cat_serviciosclin'

    id_serviciosclin = db.Column(db.Integer, primary_key=True, autoincrement=True)
    serviciosclin = db.Column(db.String(30), nullable=False, unique=True, default=None)
    est_serviciosclin = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatEstudiosMed(db.Model):
    __tablename__ = 'cat_estudiosmed'

    id_estudiomed = db.Column(db.Integer, primary_key=True, autoincrement=True)
    estudiomed = db.Column(db.String(255), nullable=False, unique=True, default=None)
    valor = db.Column(db.Numeric(18, 2), nullable=False, default=0.00)
    tp_estudiomed = db.Column(db.String(20), nullable=False, default=None)
    indicacion = db.Column(db.String(700), nullable=False, default=None)
    estudiogral = db.Column(db.String(1), nullable=False, default=None)
    autorizado = db.Column(db.String(1), nullable=False, default=None)
    tp_grupo = db.Column(db.Integer, nullable=False, default=None)
    id_provedor = db.Column(db.Integer, nullable=False, default=None)
    est_estudiomed = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatConsultorios(db.Model):
    __tablename__ = 'cat_consultorios'

    id_consult = db.Column(db.Integer, primary_key=True, autoincrement=True)
    no_consult = db.Column(db.Integer, nullable=False, default=None)
    id_trno = db.Column(db.Integer, nullable=False, default=None)
    turno = db.Column(db.String(45), nullable=False, default=None)
    id_clin = db.Column(db.Integer, nullable=False, default=None)
    clinica = db.Column(db.String(45), nullable=False, default=None)
    consult = db.Column(db.String(50), nullable=False, default=None)
    est_consult = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    _table_args_ = (
        db.UniqueConstraint('no_consult', 'turno', 'clinica', 'consult', name='consult_UNIQUE'),
    )

class CatTpAreas(db.Model):
    __tablename__ = 'cat_tpareas'

    id_tparea = db.Column(db.Integer, primary_key=True, autoincrement=True)
    tparea = db.Column(db.String(50), nullable=False, unique=True, default=None)
    est_tparea = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatAreas(db.Model):
    __tablename__ = 'cat_areas'

    id_area = db.Column(db.Integer, primary_key=True, autoincrement=True)
    area = db.Column(db.String(150), nullable=False, unique=True, default=None)
    id_tparea = db.Column(db.Integer, nullable=False, default=None)
    tparea = db.Column(db.String(50), nullable=False, default=None)
    est_area = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None) 

    _table_args_ = (
        db.UniqueConstraint('area', 'tparea', name='area_UNIQUE'),
    )
    
class CatTpBajas(db.Model):
    __tablename__ = 'cat_tpbajas'

    id_tpbaja = db.Column(db.String(5), primary_key=True, unique=True)
    tpbaja = db.Column(db.String(100), unique=True, default=None)
    est_tpbaja = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatCies(db.Model):
    __tablename__ = 'cat_cies'

    id_cie = db.Column(db.String(5), primary_key=True, unique=True)
    archivo = db.Column(db.String(50), nullable=False, default=None)
    est_cie = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)   

class CatTpAutorizador(db.Model):
    __tablename__ = 'cat_tpautorizador'

    id_tpautorizador = db.Column(db.String(2), primary_key=True, unique=True)
    tpautorizador = db.Column(db.String(80), nullable=False, default=None)
    est_tpautorizador = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

class CatAutorizadores(db.Model):
    __tablename__ = 'cat_autorizadores'

    id_autorizador = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_clin = db.Column(db.Integer, nullable=False, default=None)
    clinica = db.Column(db.String(45), nullable=False, default=None)
    autorizador = db.Column(db.String(100), nullable=False, default=None)
    cargo = db.Column(db.String(60), nullable=False, default=None)
    id_tpautorizador = db.Column(db.String(2), nullable=False, default=None)
    tpautorizador = db.Column(db.String(80), nullable=False, default=None)
    img_firma = db.Column(db.String(200), nullable=False, default=None)
    pwd_autorizador = db.Column(db.String(20), nullable=False, default=None)
    id_usuario = db.Column(db.Integer, nullable=False, default=None)
    expediente = db.Column(db.String(8), nullable=False, default=None)
    est_autorizador = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    _table_args_ = (
        db.UniqueConstraint('pwd_autorizador', name='pwd_autorizador_UNIQUE')
        )

class CatMedicosClin(db.Model):
    __tablename__ = 'cat_medicosclin'

    id_medclin = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, nullable=False, default=None)
    expediente = db.Column(db.String(8), unique=True, nullable=False, default=None)
    paterno = db.Column(db.String(45), nullable=False, default=None)
    materno = db.Column(db.String(45), nullable=True, default=None)
    nombre = db.Column(db.String(45), nullable=False, default=None)
    sexo = db.Column(db.String(1), nullable=False, default=None) 
    fch_nac = db.Column(db.Date, nullable=False, default=None)
    cedula = db.Column(db.String(20), unique=True, nullable=False, default=None)
    id_esc = db.Column(db.Integer, nullable=False, default=None)
    id_espec = db.Column(db.Integer, nullable=False, default=None)
    id_serviciosclin = db.Column(db.Integer, nullable=False, default=None)
    id_clin = db.Column(db.Integer, nullable=False, default=None)
    id_consult = db.Column(db.Integer, nullable=False, default=None)
    hr_ini = db.Column(db.String(5), nullable=False, default=None)
    hr_term = db.Column(db.String(5), nullable=False, default=None)
    interv_consul = db.Column(db.Integer, nullable=False, default=None)
    direccion = db.Column(db.String(300), nullable=False, default=None)
    dias = db.Column(db.String(1), nullable=True, default=None)
    ambos_turn = db.Column(db.String(1), nullable=False, default=None)
    id_consult2 = db.Column(db.Integer, nullable=True, default=None)
    hr_ini2 = db.Column(db.String(5), nullable=True, default=None)
    hr_term2 = db.Column(db.String(5), nullable=True, default=None)
    interv_consul2 = db.Column(db.Integer, nullable=True, default=None)
    est_medclin = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    _table_args_ = (
        db.UniqueConstraint('expediente', name='expediente_UNIQUE'),
        db.UniqueConstraint('cedula', name='cedula_UNIQUE'),
        )


class CatMedicosEspecHosp(db.Model):
    __tablename__ = 'cat_medicosespechosp'

    id_medespec = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, nullable=False, default=None)
    usermedespec = db.Column(db.String(10), unique=True, default=None)
    paterno = db.Column(db.String(45), nullable=False, default=None)
    materno = db.Column(db.String(45), nullable=False, default=None)
    nombre = db.Column(db.String(45), nullable=False, default=None)
    sexo = db.Column(db.String(1), nullable=False, default=None) 
    fch_nac = db.Column(db.Date, nullable=False, default=None)
    cedula = db.Column(db.String(20), unique=True, default=None)
    id_esc = db.Column(db.Integer, nullable=False, default=None)
    escuela = db.Column(db.String(100), nullable=False, default=None)
    id_espec = db.Column(db.Integer, nullable=False, default=None)
    especialidad = db.Column(db.String(45), nullable=False, default=None)
    id_serviciosclin = db.Column(db.Integer, nullable=False, default=None)
    serviciosclin = db.Column(db.String(30), nullable=False, default=None)
    id_clin = db.Column(db.Integer, nullable=False, default=None)
    clinica = db.Column(db.String(30), nullable=False, default=None)
    telefono = db.Column(db.String(50), nullable=False, default=None)
    direccion = db.Column(db.String(300), nullable=False, default=None)
    est_medespec = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    _table_args_ = (
        db.UniqueConstraint('cedula', name='cedula_UNIQUE'),
        )

class CatRoles(db.Model):
    __tablename__ = 'cat_roles'

    id_rol = db.Column(db.Integer, primary_key=True, autoincrement=True)
    rol = db.Column(db.String(50), nullable=False, unique=True, default=None)
    tp_rol = db.Column(db.String(5), nullable=False, unique=True, default=None)
    desc_rol = db.Column(db.String(200), nullable=False, default=None)
    est_rol = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), nullable=False, default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None) 

    __table_args__ = (
        db.UniqueConstraint('rol', name='rol_UNIQUE'),
    )

class CatMedicamentos(db.Model):
    __tablename__ = 'cat_medicamentos'

    id_medicamento = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cve = db.Column(db.String(8), nullable=False, default=None)
    medicamento = db.Column(db.String(255), nullable=False, default=None)
    desc_medicamento = db.Column(db.String(300), nullable=False, default=None)
    med_disponible = db.Column(db.Integer, nullable=False, default=None)
    surtido = db.Column(db.Integer, nullable=False, default=None)
    est_medicamento = db.Column(db.String(1), nullable=False, default=None)
    usr_alta = db.Column(db.String(20), nullable=False, default=None)
    fch_alta = db.Column(db.DateTime, default=None)
    usr_modf = db.Column(db.String(20), default=None)
    fch_modf = db.Column(db.DateTime, default=None)
    usr_baja = db.Column(db.String(20), default=None)
    fch_baja = db.Column(db.DateTime, default=None)

    