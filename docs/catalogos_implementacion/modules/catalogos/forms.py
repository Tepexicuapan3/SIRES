from flask_wtf import FlaskForm
from wtforms import StringField, HiddenField, SelectField, SubmitField, PasswordField, FloatField, validators
from wtforms.validators import DataRequired, Length
from app.models.catalogos import * 
from app.extensions import db  # Asegúrate de que db esté importado correctamente
from utils import entidades_fed


class SubMenusForm(FlaskForm):
    txtId = StringField("ID")  # Se puede usar IntegerField si el valor no puede ser texto
    txtIdMenu = SelectField("MENÚ", validators=[DataRequired()])
    txtSubMenu = StringField("SUBMENÚ", validators=[DataRequired(), Length(max=50)])
    txtDescSubMenu = StringField("DESCRIPCIÓN DEL SUBMENÚ", validators=[DataRequired(), Length(max=200)])
    txtUrl = StringField("URL DEL SUBMENÚ", validators=[DataRequired(), Length(max=100)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField("Guardar")

    def __init__(self, *args, **kwargs):
        super(SubMenusForm, self).__init__(*args, **kwargs)
        # Menús activos ordenados por nombre
        self.txtIdMenu.choices =  [('', '')] +  [
            (menu.menu, menu.menu) 
            for menu in CatMenus.query.filter_by(est_menu='A').order_by(CatMenus.menu).all()
        ]

class MenusForm(FlaskForm):
    txtId = StringField("ID")
    txtMenu = StringField("NOMBRE MENU", validators=[DataRequired(), Length(max=50)])
    txtDescMenu = StringField("DESCRIPCIÓN MENU", validators=[DataRequired(), Length(max=200)])
    txtSearch = SelectField("MOSTRAR BUSCADOR", validators=[DataRequired(), Length(max=1)], choices=[('',''), ('S','SÍ'), ('N', 'NO')])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class EscuelasForm(FlaskForm):
    txtId = StringField("ID")
    txtEscuela = StringField("INSTITUCIÓN EDUCATIVA", validators=[DataRequired(), Length(max=100)])
    txtSiglsEsc = StringField("SIGLAS", validators=[DataRequired(), Length(max=45)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')    

class EspecialidadesForm(FlaskForm):
    txtId = StringField("ID")
    txtEspecialidad = StringField("Especialidad", validators=[DataRequired(), Length(max=45)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class ClinicaForm(FlaskForm):
    txtId = StringField("ID")
    txtClinica = StringField("CLINICA", validators=[DataRequired(), Length(max=45)])
    txtFolioClin = StringField("FOLIO", validators=[DataRequired(), Length(max=2)])
    txtInterna = SelectField("INTERNA", validators=[DataRequired(), Length(max=1)], choices=[('',''), ('S','SÍ'), ('N', 'NO')])
    txtHTMat = StringField("HORA TERMINO: TURNO MATUTINO")
    txtHTVes = StringField("HORA TERMINO: TURNO VESPERTINO")
    txtHTNoc = StringField("HORA TERMINO: TURNO NOCTURNO")
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class TurnosForm(FlaskForm):
    txtId = StringField("ID")
    txtNombre = StringField("TURNO", validators=[DataRequired(), Length(max=45)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class EnfermedadesForm(FlaskForm):
    txtId = HiddenField("ID", validators=[DataRequired()])
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=8)])
    txtEnfermedad = StringField("ENFERMEDAD", validators=[DataRequired(), Length(max=400)])
    txtVersCie = StringField("VERSIÓN CIES", validators=[DataRequired(), Length(max=5)])
    txtCies = SelectField("VERSIÓN CIES", validators=[DataRequired(), Length(max=5)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

    def __init__(self, *args, **kwargs):
        super(EnfermedadesForm, self).__init__(*args, **kwargs)
        self.txtCies.choices = [('', '')] + [(VersCie.vers_cie, VersCie.vers_cie) for VersCie in CatEnfermedades.query.with_entities(CatEnfermedades.vers_cie).distinct().all()]

    
class EscolaridadForm(FlaskForm):
    txtId = StringField("ID")
    txtNombre = StringField("ESCOLARIDAD", validators=[DataRequired(), Length(max=45)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class TipoConsultaForm(FlaskForm):
    txtId = StringField("ID")
    txtNombre = StringField("TIPO DE CONSULTA", validators=[DataRequired(), Length(max=100)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class CIE10Form(FlaskForm):
    txtId = StringField("ID")
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=10)])
    txtDesc = StringField("DESCRIPCIÓN", validators=[DataRequired(), Length(max=1000)])
    txtSexo = SelectField("SEXO", validators=[DataRequired()], choices=[('', ''), ('F', 'Femenino'), ('M', 'Masculino'), ('A', 'Ambos')])
    txtIdEspec = HiddenField("ID ESPEC", validators=[DataRequired()])
    txtDescEspec = StringField("ESPECIALIDAD", validators=[DataRequired()])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class CIE11Form(FlaskForm):
    txtId = StringField("ID")
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=10)])
    txtDesc= StringField("DESCRIPCIÓN", validators=[DataRequired(), Length(max=1000)])
    txtSexo = SelectField("SEXO" , validators=[DataRequired()], choices=[('', ''), ('F', 'Femenino'), ('M', 'Masculino'), ('A', 'Ambos')])
    txtIdEspec = HiddenField ("ID ESPEC", validators=[DataRequired()])
    txtDescEspec = StringField("ESPECIALIDAD", validators=[DataRequired()])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar') 
    
class TipoHospnForm(FlaskForm):
    txtId = StringField("ID")
    txtNombre = StringField("TIPO DE HOSPITALIZACIÓN", validators=[DataRequired(), Length(max=100)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class CalidadLabForm(FlaskForm):
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=2)])
    txtCalidadLab = StringField("CALIDAD LABORAL", validators=[DataRequired(), Length(max=50)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class EdoCivilForm(FlaskForm):
    txtId = StringField("ID")
    txtEdoCivil = StringField("ESTADO CIVIL", validators=[DataRequired(), Length(max=45)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class TpSanguineoForm(FlaskForm):
    txtId = StringField("ID")
    txtTpSanguineo = StringField("TIPO SANGUINEO", validators=[DataRequired(), Length(max=5)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class GpoMedicForm(FlaskForm):
    txtId = StringField("ID")
    txtGpoMedic = StringField("GRUPO DE MEDICAMENTO", validators=[DataRequired(), Length(max=255)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class HospitalesForm(FlaskForm):
    txtId = StringField("ID")
    txtHospital = StringField("HOSPITAL", validators=[DataRequired(), Length(max=100)])
    txtCalle = StringField("CALLE Y NÚMERO", validators=[DataRequired(), Length(max=100)])
    txtAsenta = StringField("ASENTAMIENTO", validators=[DataRequired(), Length(max=100)])
    txtCp = SelectField("CÓDIGO POSTAL", validators=[DataRequired(), Length(max=5)])
    txtMunicipio = SelectField("ALCALDÍA O MUNICIPIO", validators=[DataRequired(), Length(max=80)])
    txtEntidadFed = SelectField("ENTIDAD FEDERATIVA", validators=[DataRequired(), Length(max=50)], choices=entidades_fed)
    txtTelefono = StringField("TELÉFONO", validators=[DataRequired(), Length(max=40)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class OrigenConsForm(FlaskForm):
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=2)])
    txtOrigenCons = StringField("ORIGEN DE CONSULTA", validators=[DataRequired(), Length(max=100)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class OcupacionesForm(FlaskForm):
    txtId = StringField("ID")
    txtOcupacion = StringField("OCUPACIÓN", validators=[DataRequired(), Length(max=45)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class ParentescosForm(FlaskForm):
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=2)])
    txtParentesco = StringField("PARENTESCO", validators=[DataRequired(), Length(max=45)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class LaboratoriosForm(FlaskForm):
    txtId = StringField("ID")
    txtLaboratorio = StringField("LABORATORIO", validators=[DataRequired(), Length(max=100)])
    txtUnidadLab = StringField("UNIDAD", validators=[DataRequired(), Length(max=50)])
    txtCalle = StringField("CALLE Y NÚMERO", validators=[DataRequired(), Length(max=100)])
    txtAsenta = StringField("ASENTAMIENTO", validators=[DataRequired(), Length(max=100)])
    txtCp = SelectField("CÓDIGO POSTAL", validators=[DataRequired(), Length(max=5)])
    txtMunicipio = SelectField("ALCALDÍA O MUNICIPIO", validators=[DataRequired(), Length(max=80)])
    txtEntidadFed = SelectField("ENTIDAD FEDERATIVA", validators=[DataRequired(), Length(max=50)], choices=entidades_fed)
    txtTelefono = StringField("TELÉFONO", validators=[DataRequired(), Length(max=40)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class TpLicenciaForm(FlaskForm):
    txtId = StringField("ID")
    txtTpLicencia = StringField("TIPO DE LICENCIA", validators=[DataRequired(), Length(max=150)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class TpAutorizacionForm(FlaskForm):
    txtId = HiddenField("ID", validators=[DataRequired()])
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=2)])
    txtTpAutorizacion = StringField("TIPO DE AUTORIZACIÓN", validators=[DataRequired(), Length(max=100)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class TpCitasForm(FlaskForm):
    txtId =StringField("ID")
    txtTpCita = StringField("TIPO DE CITAS", validators=[DataRequired(), Length(max=30)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar') 

class PasesForm(FlaskForm):
    txtId = StringField("ID")
    txtPase = StringField("Pase", validators=[DataRequired(), Length(max=50)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class ServiciosClinForm(FlaskForm):
    txtId = StringField("ID")
    txtServiciosClin = StringField("SERVICIO CLÍNICO", validators=[DataRequired(), Length(max=30)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class EstudiosMedForm(FlaskForm):
    txtId = StringField("ID")
    txtEstudioMed = StringField("ESTUDIO MÉDICO", validators=[DataRequired(), Length(max=255)])
    txtValor = FloatField("VALOR", validators=[DataRequired()])
    txtTpEstudioMed = SelectField("TIPO", validators=[DataRequired()], choices=[('',''), ('GABINETE', 'GABINETE'), ('LABORATORIO', 'LABORATORIO'), ('ADICIONALES', 'ADICIONALES'), ('OTROS', 'OTROS')]) 
    txtIndicacion = StringField("INDICACIONES", validators=[DataRequired(), Length(max=700)])
    txtEstudioGral = SelectField("ESTUDIO GENERAL", validators=[Length(max=1)], choices=[('','NONE'), ('G', 'GENERAL')])
    txtAutorizado = SelectField("REQUIERE AUTORIZACIÓN", validators=[Length(max=1)], choices=[('','NONE'), ('S', 'SÍ')])
    txtTpGrupo = StringField("TIPO DE GRUPO", validators=[DataRequired()])
    txtIdProvedor = StringField("ID PROVEDOR", validators=[DataRequired()])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class ConsultoriosForm(FlaskForm):
    txtId = StringField("ID") 
    txtNoConsult = StringField("NO.", validators=[DataRequired()])
    txtIdTrno = SelectField("TURNO", validators=[DataRequired()])
    txtIdClin = SelectField("CLÍNICA", validators=[DataRequired()]) 
    txtConsult = StringField("TIPO DE CONSULTORIO", validators=[DataRequired(), Length(max=50)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

    def __init__(self, *args, **kwargs):
        super(ConsultoriosForm, self).__init__(*args, **kwargs)
        # Carga las opciones de txtClinicas con la descripción y guarda los IDs en la base de datos
        self.txtIdTrno.choices = [('', '')] + [(Turn.turno, Turn.turno) for Turn in CatTurnos.query.filter_by(est_trno='A').order_by(CatTurnos.turno)]
        self.txtIdClin.choices = [('', '')] + [(clin.clinica, clin.clinica) for clin in CatClinicas.query.filter_by(est_clin='A', interna='S').order_by(CatClinicas.clinica)] 

class TpAreasForm(FlaskForm):
    txtId = StringField("ID")
    txtTpArea = StringField("TIPO AREA", validators=[DataRequired(), Length(max=50)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class AreasForm(FlaskForm):
    txtId = StringField("ID") 
    txtArea = StringField("ÁREA", validators=[DataRequired(), Length(max=150)])
    txtIdTpArea = SelectField("TIPO DE ÁREA", validators=[DataRequired()])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')    

    def __init__(self, *args, **kwargs):
        super(AreasForm, self).__init__(*args, **kwargs)
        # Carga las opciones de txtTpAreas con la descripción y guarda los IDs en la base de datos
        self.txtIdTpArea.choices = [('', '')] + [(TpArea.tparea, TpArea.tparea) for TpArea in CatTpAreas.query.filter_by(est_tparea='A').order_by(CatTpAreas.tparea)]

class TpBajasForm(FlaskForm):
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=5)])
    txtTpBaja = StringField("TIPO DE BAJA", validators=[DataRequired(), Length(max=100)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class CiesForm(FlaskForm):
    txtCve = StringField("VERSIÓN CIE", validators=[DataRequired(), Length(max=5)])
    txtArchivo = StringField("ARCHIVO EXCEL .XLS", validators=[DataRequired(), Length(max=50)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class TpAutorizadorForm(FlaskForm):
    txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=2)])
    txtTpAutorizador = StringField("TIPO DE AUTORIZADOR", validators=[DataRequired(), Length(max=80)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')    

class AutorizadoresForm(FlaskForm):
    txtId = StringField("ID") 
    txtCve = StringField("CLAVE CLÍNICA", validators=[DataRequired(), Length(max=50)])
    txtClinica = StringField("CLÍNICA", validators=[DataRequired(), Length(max=45)])
    txtAutorizador = StringField("NOMBRE AUTORIZADOR", validators=[DataRequired(), Length(max=100)])           
    txtCargo = StringField("CARGO", validators=[DataRequired(), Length(max=600)])
    txtIdTpAutorizador = HiddenField("CLAVE AUTORIZADOR", validators=[DataRequired()])
    txtTpAutorizador = StringField("TIPO AUTORIZADOR", validators=[DataRequired(), Length(max=80)])
    txtImgFirma = StringField("IMAGEN FIRMA", validators=[DataRequired(), Length(max=200)])
    txtPwdAutorizador = PasswordField("PASSWORD USUARIO", validators=[DataRequired(), Length(max=20)])
    txtIdUser = StringField("ID USUARIO", validators=[DataRequired()])
    txtUsuario  = StringField("USUARIO", validators=[DataRequired()])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')


class MedicosClinForm(FlaskForm):
    txtId = StringField("ID") 
    txtUsuario = StringField("USUARIO", validators=[DataRequired(), Length(max=147)]) 
    txtSexo = SelectField("SEXO", validators=[DataRequired()], choices=[('', ''), ('F', 'Femenino'), ('M', 'Masculino')])
    txtFchNac = StringField("FECHA NACIMIENTO", validators=[DataRequired()])
    txtCedula = StringField("CÉDULA", validators=[DataRequired(), Length(max=10)])
    txtEscuela = StringField("ESCUELA", validators=[DataRequired()])
    txtEspecialidad = StringField("ESPECIALIDAD", validators=[DataRequired()])
    txtServiciosClin = StringField("SERVICIOS CLÍNICAS", validators=[DataRequired()])
    txtClinica = StringField("CLÍNICA", validators=[DataRequired(), Length(max=45)])
    txtConsultorio = StringField("CONSULTORIO", validators=[DataRequired()])
    txtHrIni = StringField("H. INICIO", validators=[DataRequired()])
    txtHrTerm = StringField("H. TÉRMINO", validators=[DataRequired()])
    txtIntervConsul = StringField("INTERVALO", validators=[DataRequired(), Length(max=10)])
    txtDireccion = StringField("DIRECCIÓN", validators=[DataRequired(), Length(max=300)])
    txtDias = SelectField("DÍAS LABORALES", choices=[('', ''), ('S', 'LUNES A VIERNES'), ('F', 'FIN DE SEMANA')])
    txtAmbosTurnos = SelectField("AMBOS TURNOS", validators=[DataRequired(),Length(max=1)], choices=[('', ''), ('S', 'SÍ'), ('N', 'NO')])
    txtConsultorio2 = StringField("2.º CONSULTORIO", validators=[DataRequired()])
    txtHrInic2 = StringField("2.º H. INICIO", validators=[DataRequired()])
    txtHrTerm2 = StringField("2.º H. TÉRMINO", validators=[DataRequired()])
    txtIntervConsul2 = StringField("2.º INTERVALO", validators=[DataRequired(), Length(max=10)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class MedicosEspecHospForm(FlaskForm):
    txtId = StringField("ID")
    txtIdUser = HiddenField("ID USUARIO", validators=[DataRequired()]) 
    txtCve = StringField("CLAVE USUARIO", validators=[DataRequired(), Length(max=10)])
    txtUsuario = StringField("USUARIO MÉDICO ESPECIALISTA", validators=[DataRequired()])
    txtTpMed = SelectField("TIPO DE MÉDICO", validators=[DataRequired(), Length(max=5)], choices=[('', ''), ('I', 'INTERNO'), ('E', 'EXTERNO')])
    txtSexo = SelectField("SEXO", validators=[DataRequired()], choices=[('', ''), ('F', 'FEMENINO'), ('M', 'MASCULINO')])
    txtFchNac = StringField("FECHA NACIMIENTO", validators=[DataRequired()])
    txtCedula = StringField("CÉDULA", validators=[DataRequired(), Length(max=20)])
    txtIdEscuela = HiddenField("ID ESCUELA", validators=[DataRequired()])
    txtEscuela = StringField("ESCUELA", validators=[DataRequired()])
    txtIdEspecialidad = HiddenField("ID ESPECIALIDAD", validators=[DataRequired()])
    txtEspecialidad = StringField("ESPECIALIDAD", validators=[DataRequired()])
    txtIdServiciosClin = HiddenField("ID SERVICIOS", validators=[DataRequired()])
    txtServiciosClin = StringField("SERVICIOS CLINICAS", validators=[DataRequired()])
    txtIdClinica = HiddenField("ID CLÍNICA", validators=[DataRequired(30)])
    txtClinica = StringField("CLÍNICA", validators=[DataRequired(), Length(max=30)])
    txtTelefono = StringField("TELÉFONO", validators=[DataRequired(50)])
    txtDireccion = StringField("DIRECCIÓN", validators=[DataRequired(), Length(max=300)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class RolesForm(FlaskForm):
    txtId = StringField("ID") 
    txtRol = StringField("ROL", validators=[DataRequired(), Length(max=50)])
    txtTpRol = StringField("TIPO DE ROL", validators=[DataRequired(), Length(max=5)])
    txtDescRol = StringField("DESCRIPCIÓN DEL ROL", validators=[DataRequired(), Length(max=200)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

class MedicamentosForm(FlaskForm):
    txtId = StringField("ID")
    txtCVE = txtCve = StringField("CLAVE", validators=[DataRequired(), Length(max=8)])
    txtMedicamento = StringField("NOMBRE", validators=[DataRequired(), Length(max=255)]) 
    txtDescMedicamento = StringField("DESCRIPCIÓN", validators=[DataRequired(), Length(max=300)])
    txtMedDisponible = StringField("UNIDADES", validators=[DataRequired()])
    txtSurtido = StringField("SURTIDO", validators=[DataRequired()])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')