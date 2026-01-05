from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, HiddenField, SelectField
from wtforms.validators import DataRequired, Length
from app.models.users import *
from app.models.catalogos import CatSubMenus, CatRoles
from app.modules.catalogos.forms import SubMenusForm, RolesForm

class SyUsuariosForm(FlaskForm):
    txtId = StringField("ID")
    txtUsuario = StringField("USUARIO", validators=[DataRequired(), Length(max=20)])
    txtNombre = StringField("NOMBRE USUARIO", validators=[DataRequired(), Length(max=45)])
    txtPaterno = StringField("APELIIDO PATERNO", validators=[DataRequired(), Length(max=45)])
    txtMaterno = StringField("APELLIDO MATERNO", validators=[DataRequired(), Length(max=45)])
    txtExpediente = StringField("EXPEDIENTE", validators=[DataRequired(), Length(max=8)])
    txtCurp = StringField("CURP", validators=[DataRequired(), Length(max=45)])
    txtImgPerfil = StringField("IMAGEN PERFIL", validators=[DataRequired(), Length(max=100)])
    txtCorreo = StringField("CORREO", validators=[DataRequired(), Length(max=100)])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')


class LoginForm(FlaskForm):
    username=StringField("Nombre de Usuario", validators=[DataRequired()])
    password=PasswordField("Contraseña", validators=[DataRequired()])
    submit=SubmitField('Enviar')

class AdminSubmenusForm(FlaskForm):
    txtId = StringField("ID")
    txtIdSubmenu = SelectField("SUBMENU", validators=[DataRequired()])
    txtIdTpRol = SelectField("TIPO DE ROL", validators=[DataRequired()])
    opcion = HiddenField("opcion", validators=[DataRequired()])
    submit = SubmitField('Guardar')

    def __init__(self, *args, **kwargs):
        super(AdminSubmenusForm, self).__init__(*args, **kwargs)
        # Asigna las opciones dinámicamente
        self.txtIdSubmenu.choices = [('', '')] + [(submen.submenu, submen.submenu) for submen in CatSubMenus.query.filter_by(est_submenu='A').order_by(CatSubMenus.submenu).all()] 
        self.txtIdTpRol.choices = [('', '')] + [(tiporol.tp_rol, tiporol.tp_rol) for tiporol in CatRoles.query.filter_by(est_rol='A').order_by(CatRoles.tp_rol).all()] 


