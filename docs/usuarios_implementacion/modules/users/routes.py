from flask import Flask, Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, g, abort, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from datetime import datetime, timedelta,date
from flask_mail import Message
from app import db, mail, limiter
from app.modules.users.forms import *
from app.models.users import *
from sqlalchemy import text
from itsdangerous import URLSafeTimedSerializer
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from app.modules.users.utils_users import obtener_permisos_usuario
#import secrets
import string
import random
#from app.models.users import SyUsuarios  # Ajusta según tu estructura
from app.models.catalogos import CatSubMenus

users_bp = Blueprint('users', __name__)
auth_bp = Blueprint('auth', __name__)


#autentificacion modificada 23/05/2025
'''@users_bp.route('/', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    session.permanent = True
    form = LoginForm()

    if form.validate_on_submit():
        user = SyUsuarios.query.filter_by(usuario=form.username.data).first()

        if user:
            if len(user.clave) <= 100:
                flash("Es necesario un cambio de contraseña", 'error')
            elif check_password_hash(user.clave, form.password.data):
                login_user(user)
                now = datetime.now()

                # Obtener IP del cliente
                ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)

                user_detail = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()
                
                if user_detail:
                    # Actualizamos las conexiones
                    user_detail.last_conexion = user_detail.act_conexion
                    user_detail.act_conexion = now
                    user_detail.ip_ultima = ip_address  # <--- Guardar IP

                    # Eliminar token y vida_token al logearse
                    user_detail.token = None
                    user_detail.vida_token = None
                else:
                    user_detail = DetUsuarios(
                        id_usuario=user.id_usuario,
                        last_conexion=now,
                        act_conexion=now,
                        terminos_acept='F',
                        cambiar_clave='T',
                        ip_ultima=ip_address  # <--- Guardar IP si es nuevo
                    )
                    db.session.add(user_detail)

                db.session.commit()
                session['fecha_anterior'] = user_detail.last_conexion
                session['fecha'] = user_detail.act_conexion

                return redirect(url_for('users.inicio'))
            else:
                flash("Contraseña equivocada, intenta de nuevo", 'error')
        else:
            flash("No existe este usuario, intenta de nuevo", 'error')

    return render_template('auth/login.html', form=form)'''
###################################################################################
'''@users_bp.before_request
def proteger_rutas_administracion():
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))

    urls_permitidas = session.get('urls_permitidas', [])
    if not any(request.path.startswith(url) for url in urls_permitidas):
        abort(403)'''

'''@users_bp.before_request
def proteger_rutas_administracion():
    # 1. Verificar si está autenticado
    if not current_user.is_authenticated:
        return redirect(url_for('users.login'))

    # 2. Verificar si el usuario sigue existiendo en la base de datos
    user_exists = SyUsuarios.query.get(current_user.id)
    if user_exists is None:
        # Cerrar sesión o redirigir
        return redirect(url_for('users.logout'))

    # 3. Verificar si tiene permiso para la URL solicitada
    urls_permitidas = session.get('urls_permitidas', [])
    if not any(request.path.startswith(url) for url in urls_permitidas):
        abort(403)'''
###########################################################################################################

'''@users_bp.route('/', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    session.permanent = True
    form = LoginForm()

    if form.validate_on_submit():
        user = SyUsuarios.query.filter_by(usuario=form.username.data).first()

        if user:
            if len(user.clave) <= 100:
                flash("Es necesario un cambio de contraseña", 'error')
            elif check_password_hash(user.clave, form.password.data):
                login_user(user)
                now = datetime.now()

                # Obtener IP del cliente
                ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)

                user_detail = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()
                
                if user_detail:
                    # Actualizamos las conexiones
                    user_detail.last_conexion = user_detail.act_conexion
                    user_detail.act_conexion = now
                    user_detail.ip_ultima = ip_address
                    user_detail.token = None
                    user_detail.vida_token = None
                else:
                    user_detail = DetUsuarios(
                        id_usuario=user.id_usuario,
                        last_conexion=now,
                        act_conexion=now,
                        terminos_acept='F',
                        cambiar_clave='T',
                        ip_ultima=ip_address
                    )
                    db.session.add(user_detail)

                db.session.commit()  # ✅ Guardamos DetUsuarios primero

                # ✅ Ahora registramos en bit_accesos
                nuevo_acceso = BitAccesos(
                    id_usuario=user.id_usuario,
                    ip_ultima=ip_address,
                    conexion_act='EN SESIÓN',  # Puedes cambiarlo si prefieres guardar datetime
                    fecha_conexion=now  # Asegúrate de tener este campo en el modelo y la tabla
                )
                db.session.add(nuevo_acceso)
                db.session.commit()  # Guardamos acceso

                session['fecha_anterior'] = user_detail.last_conexion
                session['fecha'] = user_detail.act_conexion
                # Obtener menús y guardarlos en la sesión
                session['menus'] = obtener_permisos_usuario(user.id_usuario)

                return redirect(url_for('users.inicio'))
            else:
                flash("Contraseña equivocada, intenta de nuevo", 'error')
        else:
            flash("No existe este usuario, intenta de nuevo", 'error')

    return render_template('auth/login.html', form=form)

@users_bp.before_request
def verificar_acceso_usuario():
    from flask import request, session, redirect, url_for, flash
    from flask_login import current_user

    rutas_sin_restriccion = [
        '/', '/favicon.ico',
        '/usuarios/login', '/usuarios/logout',
        '/static/', '/api/public/'
    ]

    ruta_actual = request.path.lower()

    if any(ruta_actual.startswith(r) for r in rutas_sin_restriccion):
        return

    if not current_user.is_authenticated:
        return redirect(url_for('users_bp.login'))

    urls_permitidas = session.get('urls_permitidas', [])

    if ruta_actual not in urls_permitidas:
        flash("Acceso denegado: no tienes permiso para esta ruta.", "danger")
        return redirect(url_for('users_bp.dashboard'))'''

from flask import url_for, current_app

'''@users_bp.route('/', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    session.permanent = True
    form = LoginForm()

    if form.validate_on_submit():
        user = SyUsuarios.query.filter_by(usuario=form.username.data).first()

        if user:
            if len(user.clave) <= 100:
                flash("Es necesario un cambio de contraseña", 'error')
            elif check_password_hash(user.clave, form.password.data):
                login_user(user)
                now = datetime.now()

                ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)

                user_detail = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()

                if user_detail:
                    user_detail.last_conexion = user_detail.act_conexion
                    user_detail.act_conexion = now
                    user_detail.ip_ultima = ip_address
                    user_detail.token = None
                    user_detail.vida_token = None
                else:
                    user_detail = DetUsuarios(
                        id_usuario=user.id_usuario,
                        last_conexion=now,
                        act_conexion=now,
                        terminos_acept='F',
                        cambiar_clave='T',
                        ip_ultima=ip_address
                    )
                    db.session.add(user_detail)

                db.session.commit()

                nuevo_acceso = BitAccesos(
                    id_usuario=user.id_usuario,
                    ip_ultima=ip_address,
                    conexion_act='EN SESIÓN',
                    fecha_conexion=now
                )
                db.session.add(nuevo_acceso)
                db.session.commit()

                session['fecha_anterior'] = user_detail.last_conexion
                session['fecha'] = user_detail.act_conexion

                permisos_dict = obtener_permisos_usuario(user.id_usuario)
                session['menus'] = permisos_dict

                # Convertir nombres de endpoint a URLs reales permitidas
                urls_permitidas = []
                with current_app.app_context():
                    for menu in permisos_dict.values():
                        for submenu in menu['submenus']:
                            endpoint = submenu['url']  # Ej: 'users.bitacora_equipos'
                            try:
                                url = url_for(endpoint)
                                urls_permitidas.append(url)
                            except Exception:
                                # Ignorar endpoints inválidos
                                pass

                session['urls_permitidas'] = urls_permitidas

                # Obtener todas las URLs registradas en CatSubMenus activas (todos los submenus)
                

                urls_registradas = []
                submenus_activos = CatSubMenus.query.filter_by(est_submenu='A').all()
                with current_app.app_context():
                    for submenu in submenus_activos:
                        endpoint = submenu.url.lower()
                        try:
                            url = url_for(endpoint)
                            urls_registradas.append(url)
                        except Exception:
                            pass

                # Calcular URLs no permitidas: todas las registradas menos las permitidas
                urls_nopermitidas = list(set(urls_registradas) - set(urls_permitidas))
                session['urls_nopermitidas'] = urls_nopermitidas
                
                return redirect(url_for('users.inicio'))
            else:
                flash("Contraseña equivocada, intenta de nuevo", 'error')
        else:
            flash("No existe este usuario, intenta de nuevo", 'error')

    return render_template('auth/login.html', form=form)'''


##########################CORRECIÓN DE LOS PERMISOS PAAR QEU NO TENGA QUE VOLVER A INGRESAR SI SE LE MODIFICAN LOS PERMISOS#####################
@users_bp.route('/', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    session.permanent = True
    form = LoginForm()

    if form.validate_on_submit():
        user = SyUsuarios.query.filter_by(usuario=form.username.data).first()

        if user:
            if len(user.clave) <= 100:
                flash("Es necesario un cambio de contraseña", 'error')
            elif check_password_hash(user.clave, form.password.data):
                login_user(user)
                now = datetime.now()

                ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)

                user_detail = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()

                if user_detail:
                    user_detail.last_conexion = user_detail.act_conexion
                    user_detail.act_conexion = now
                    user_detail.ip_ultima = ip_address
                    user_detail.token = None
                    user_detail.vida_token = None
                else:
                    user_detail = DetUsuarios(
                        id_usuario=user.id_usuario,
                        last_conexion=now,
                        act_conexion=now,
                        terminos_acept='F',
                        cambiar_clave='T',
                        ip_ultima=ip_address
                    )
                    db.session.add(user_detail)

                db.session.commit()

                nuevo_acceso = BitAccesos(
                    id_usuario=user.id_usuario,
                    ip_ultima=ip_address,
                    conexion_act='EN SESIÓN',
                    fecha_conexion=now
                )
                db.session.add(nuevo_acceso)
                db.session.commit()

                session['fecha_anterior'] = user_detail.last_conexion
                session['fecha'] = user_detail.act_conexion

                # Esto ya no es necesario si usas el before_request,
                # pero lo dejamos por si quieres que se cargue también al iniciar sesión
                actualizar_permisos_en_sesion(user.id_usuario)

                return redirect(url_for('users.inicio'))
            else:
                flash("Contraseña equivocada, intenta de nuevo", 'error')
        else:
            flash("No existe este usuario, intenta de nuevo", 'error')

    return render_template('auth/login.html', form=form)



def actualizar_permisos_en_sesion(id_usuario):
    from flask import current_app
    permisos_dict = obtener_permisos_usuario(id_usuario)
    session['menus'] = permisos_dict

    # Obtener endpoints válidos permitidos
    urls_permitidas = []
    with current_app.app_context():
        for menu in permisos_dict.values():
            for submenu in menu['submenus']:
                endpoint = submenu['url']
                try:
                    url = url_for(endpoint)
                    urls_permitidas.append(url)
                except Exception:
                    pass
    session['urls_permitidas'] = urls_permitidas

    # Obtener todos los endpoints registrados activos
    submenus_activos = CatSubMenus.query.filter_by(est_submenu='A').all()
    urls_registradas = []
    with current_app.app_context():
        for submenu in submenus_activos:
            endpoint = submenu.url.lower()
            try:
                url = url_for(endpoint)
                urls_registradas.append(url)
            except Exception:
                pass

    urls_nopermitidas = list(set(urls_registradas) - set(urls_permitidas))
    session['urls_nopermitidas'] = urls_nopermitidas

################################################################################################################################################










'''@users_bp.route('/', methods=['GET', 'POST'])
@limiter.limit("5 per minute")
def login():
    session.permanent = True
    form = LoginForm()

    if form.validate_on_submit():
        user = SyUsuarios.query.filter_by(usuario=form.username.data).first()

        if user:
            if len(user.clave) <= 100:
                flash("Es necesario un cambio de contraseña", 'error')
            elif check_password_hash(user.clave, form.password.data):
                login_user(user)
                now = datetime.now()

                ip_address = request.headers.get('X-Forwarded-For', request.remote_addr)

                user_detail = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()

                if user_detail:
                    user_detail.last_conexion = user_detail.act_conexion
                    user_detail.act_conexion = now
                    user_detail.ip_ultima = ip_address
                    user_detail.token = None
                    user_detail.vida_token = None
                else:
                    user_detail = DetUsuarios(
                        id_usuario=user.id_usuario,
                        last_conexion=now,
                        act_conexion=now,
                        terminos_acept='F',
                        cambiar_clave='T',
                        ip_ultima=ip_address
                    )
                    db.session.add(user_detail)

                db.session.commit()

                nuevo_acceso = BitAccesos(
                    id_usuario=user.id_usuario,
                    ip_ultima=ip_address,
                    conexion_act='EN SESIÓN',
                    fecha_conexion=now
                )
                db.session.add(nuevo_acceso)
                db.session.commit()

                session['fecha_anterior'] = user_detail.last_conexion
                session['fecha'] = user_detail.act_conexion

                resultado_permisos = obtener_permisos_usuario(user.id_usuario)

                # Extraer datos individuales
                session['menus'] = resultado_permisos['permisos']
                session['urls_permitidas'] = resultado_permisos['urls_permitidas']
                session['urls_nopermitidas'] = resultado_permisos['urls_nopermitidas']


                return redirect(url_for('users.inicio'))
            else:
                flash("Contraseña equivocada, intenta de nuevo", 'error')
        else:
            flash("No existe este usuario, intenta de nuevo", 'error')

    return render_template('auth/login.html', form=form)'''




def obtener_urls_permitidas(permisos_dict):
    urls_permitidas = []
    with current_app.app_context():
        for menu in permisos_dict.values():
            for submenu in menu['submenus']:
                endpoint = submenu['url']  # ej: 'users.bitacora_equipos'
                try:
                    url = url_for(endpoint)
                    urls_permitidas.append(url)
                except Exception:
                    # Ignorar endpoints inválidos o no encontrados
                    pass
    return urls_permitidas


def obtener_urls_completas_activas():
    urls = []
    submenus_activos = CatSubMenus.query.filter_by(est_submenu='A').all()
    with current_app.app_context():
        for submenu in submenus_activos:
            try:
                url = url_for(submenu.url)
                urls.append(url)
            except Exception:
                pass
    return urls



# Cierre de sesión
'''@users_bp.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    logout_user()
    flash("Sesión cerrada", 'success')
    return redirect(url_for('users.login'))'''

@users_bp.route('/logout', methods=['GET', 'POST'])
@login_required
def logout():
    acceso = BitAccesos.query.filter_by(
        id_usuario=current_user.id_usuario,
        conexion_act='EN SESIÓN'
    ).order_by(BitAccesos.id_acceso.desc()).first()

    if acceso:
        acceso.conexion_act = 'FUERA DE SESIÓN'
        db.session.commit()

    logout_user()
    flash("Sesión cerrada", 'success')
    return redirect(url_for('users.login'))




# Aceptar términos
@login_required
@users_bp.route('/aceptar_terminos', methods=['POST'])
def aceptar_terminos():
    id_usuario = current_user.id_usuario
    usuario = DetUsuarios.query.filter_by(id_usuario=id_usuario).first()

    if usuario:
        usuario.terminos_acept = 'T'
        db.session.commit()
        return jsonify({"status": "success", "message": "Términos aceptados exitosamente."})

    return jsonify({"status": "error", "message": "No se pudo actualizar los términos."}), 500


# Verificar términos antes de cada solicitud
@users_bp.before_app_request
def check_terminos_acept():
    if current_user.is_authenticated:
        user_detail = DetUsuarios.query.filter_by(id_usuario=current_user.id_usuario).first()
        
        if user_detail:
            g.acpto_terminos = user_detail.terminos_acept
            session['acpto_terminos'] = user_detail.terminos_acept
            g.actualizar_clave = user_detail.cambiar_clave
            session['actualizar_clave'] = user_detail.cambiar_clave
        else:
            flash("El Usuario no existe.", 'error')


# Vista de inicio
@users_bp.route('/inicio', methods=['GET', 'POST'])
@login_required
def inicio():
    fecha_anterior = session.get('fecha_anterior')
    curp = None
    if current_user.is_authenticated:
        curp = current_user.curp  # Asumiendo que SyUsuarios tiene el campo curp
    return render_template('inicio.html', fecha_anterior=fecha_anterior, curp=curp)


# Función para generar un token seguro con los requisitos específicos
def generate_code(longitud=8):
    mayusculas = string.ascii_uppercase
    minusculas = string.ascii_lowercase
    digitos = string.digits
    caracteres_especiales = string.punctuation
    # Asegurarse de que el token tenga al menos una mayúscula, una minúscula, un número y un carácter especial
    token = [
        random.choice(mayusculas),
        random.choice(minusculas),
        random.choice(digitos),
        random.choice(caracteres_especiales),
    ] 
    # Llenar el resto del token con caracteres aleatorios
    resto = random.choices(mayusculas + minusculas + digitos + caracteres_especiales, k=longitud - 4)
    token.extend(resto)
    # Mezclar los caracteres para que el token sea aleatorio
    random.shuffle(token)
    # Unir los caracteres y devolver el token como una cadena
    return ''.join(token)

# Función para generar un token de longitud 8 con caracteres permitidos
def generate_custom_token(length=8):
    characters = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    token = ''.join(random.choices(characters, k=length))
    return token

def enviar_correo_token(correo, nombre, paterno, materno, clave, usuario):
    # Generar un código único
    codigo = clave
    # Configurar el mensaje de correo
    msg = Message(
        "SIRES - Código de cambio de contraseña",
        sender='noreply@demo.com',
        recipients=[correo]
    )
    # Renderizar el mensaje con el código incluido
    msg.html = render_template(
        'email_template.html',
        FIRSTNAME=nombre,
        LASTNAME=paterno + ' ' + materno,
        codigo=codigo,  # Nota: aquí usamos 'codigo' en minúsculas
        usuario= usuario
    )
    # Enviar el correo
    mail.send(msg)
    return f"Correo enviado a {correo} con la nueva clave"


#############################################Funcion solicitar contrasena nueva##############################
# Solicitar cambio de contraseña
@login_required
@users_bp.route('/solicitar_cambio_contrasena', methods=['GET', 'POST'])
def solicitar_cambio_contrasena():
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        curp = request.form.get('curp')
        correo = request.form.get('correo')

        user = SyUsuarios.query.filter_by(usuario=usuario, curp=curp, correo=correo).first()

        if user:
            det_user = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()

            if not det_user:
                flash("No se encontraron detalles adicionales del usuario.", "error")
                return redirect(url_for('users.solicitar_cambio_contrasena'))

            token = generate_code(8)  # Token sin hashear
            hashed_token = generate_password_hash(token)  # Token hasheado
            vida_token = datetime.now() + timedelta(hours=1)

            det_user.token = hashed_token
            det_user.vida_token = vida_token
            db.session.commit()

            try:
                msg = Message(
                    "Recuperación de contraseña",
                    sender="noreply@example.com",
                    recipients=[correo]
                )

                msg.html = render_template(
                    'cambiar_clave.html',
                    codigo=token,  # Envía el token sin hashear en el correo
                    usuario=user.usuario,
                    FIRSTNAME=user.nombre,
                    LASTNAME=f"{user.paterno} {user.materno}"
                )

                mail.send(msg)

                flash("Se ha enviado un correo con las instrucciones para recuperar tu contraseña.", "success")
                return redirect(url_for('users.login'))
            except Exception as e:
                flash(f"Error al enviar el correo. Intenta ingresando el token mostrado para cambiar tu contraseña: {token}", "error")
                return redirect(url_for('users.validar_codigo'))

        else:
            flash("Los datos ingresados no coinciden con ningún usuario.", "error")

    return render_template('solicitar_cambio_contrasena.html')


####################################################################################################
# Validar código
@users_bp.route('/validar_codigo', methods=['GET', 'POST'])
def validar_codigo():
    if request.method == 'POST':
        usuario = request.form.get('usuario')
        curp = request.form.get('curp')
        token = request.form.get('token')  # Token ingresado por el usuario

        # Buscar usuario en la base de datos
        user = SyUsuarios.query.filter_by(usuario=usuario, curp=curp).first()

        if user:
            # Buscar detalles del usuario
            det_user = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()

            if not det_user:
                flash("No se encontraron detalles adicionales del usuario.", "error")
                return redirect(url_for('users.validar_codigo'))

            # Verificar si el token ingresado coincide con el hash del token almacenado
            if check_password_hash(det_user.token, token):
                # Verificar si el token aún es válido (dentro del tiempo de vida)
                if det_user.vida_token > datetime.now():
                    flash("El código es válido. Puedes proceder a cambiar tu contraseña.", "success")
                    return redirect(url_for('users.cambiar_contrasena', curp=curp))
                else:
                    flash("El código ha expirado. Solicita uno nuevo.", "error")
            else:
                flash("El código ingresado no es válido.", "error")

        else:
            flash("Los datos ingresados no coinciden con ningún usuario.", "error")

    return render_template('validar_codigo.html')


@users_bp.route('/cambiar_contrasena/<curp>', methods=['GET', 'POST'])
def cambiar_contrasena(curp):
    if request.method == 'GET':
        # Render the template to show the form
        return render_template('cambiar_contrasena.html', curp=curp)

    if request.method == 'POST':
        # Handle form submission
        nueva_contrasena = request.form.get('password')  # Capture new password

        if not nueva_contrasena:
            flash("Error: Debes proporcionar una nueva contraseña.", 'error')
            return redirect(url_for('users.cambiar_contrasena', curp=curp))

        # Buscar el usuario por CURP
        user = SyUsuarios.query.filter_by(curp=curp).first()
        if user:
            det_user = DetUsuarios.query.filter_by(id_usuario=user.id_usuario).first()
            if det_user:
                # Cambiar la contraseña del usuario
                user.clave = generate_password_hash(nueva_contrasena)

                # Invalidar el token después de cambiar la contraseña
                det_user.cambiar_clave = 'F'
                det_user.token = None  # Borra el token
                det_user.vida_token = None  # Opcional: Deja el campo de expiración vacío
                db.session.commit()

                flash("Contraseña cambiada exitosamente.", 'success')
                return redirect(url_for('users.login'))
            else:
                flash("Error: No se encontraron detalles adicionales del usuario.", 'error')
        else:
            flash("Error: Usuario no encontrado.", 'error')

    return render_template('cambiar_contrasena.html', curp=curp)


@users_bp.route('/sy_usuarios', methods=['GET', 'POST'])
def sy_usuarios():
    form = SyUsuariosForm()
    if request.method == 'POST':
        try:
            session['bool_data'] = "false"
            opcion = form.opcion.data.upper()
            id_usuario = form.txtId.data.upper()
            usuario = form.txtUsuario.data.upper()
            nombre = form.txtNombre.data.upper()
            paterno = form.txtPaterno.data.upper()
            materno = form.txtMaterno.data.upper()
            expediente = form.txtExpediente.data.upper()
            curp = form.txtCurp.data.upper()
            img_perfil = form.txtImgPerfil.data.upper()
            correo = form.txtCorreo.data.upper()
            id_usr = "1".upper()

            # Generar una nueva clave aleatoria
            nueva_clave = generate_code(8)
            hashed_clave = generate_password_hash(nueva_clave)

            # Ejecutar el procedimiento almacenado
            result = db.session.execute(
                text("CALL sp_menu_sy_usuarios(:ve_opcion, :ve_id_usuario, :ve_usuario, :ve_clave, :ve_nombre, :ve_paterno,:ve_materno, :ve_expediente, :ve_curp, :ve_img_perfil, :ve_correo, :ve_id_usr, @vs_id_usuario, @vs_resp, @vs_dsc_resp, @vs_bool_resp)"),
                {'ve_opcion': opcion, 've_id_usuario': id_usuario, 've_usuario': usuario, 've_clave': hashed_clave, 've_nombre': nombre, 've_paterno': paterno, 've_materno': materno, 've_expediente': expediente, 've_curp': curp, 've_img_perfil': img_perfil, 've_correo': correo, 've_id_usr': id_usr}
            )

            db.session.commit()

            result_tuple = result.first()
            vs_resp = result_tuple[-4]
            vs_dsc_resp = result_tuple[-3]
            vs_bool_resp = result_tuple[-2]

            if vs_bool_resp == 'true':
                if opcion == "153":
                    try:

                        # Enviar correo con el token
                        enviar_correo_token(correo, nombre, paterno, materno, nueva_clave, usuario)
                        flash(f"El usuario {expediente} se generó con éxito. Se ha enviado un token a su correo para que ingrese su contraseña.", 'success')
                        
                    except Exception as ex:

                        # En caso de error en el envío de correo, mostrar la misma clave generada
                        flash(f" {str(ex)} El usuario {expediente} se generó con éxito. Contraseña: {nueva_clave}", 'success')
                        
                        # Guardar la clave encriptada en la base de datos
                        user = SyUsuarios.query.filter_by(expediente=expediente).first()
                        if user:
                            user.clave = hashed_clave
                            db.session.commit()
                        else:
                            flash(f"No se encontró el usuario con expediente {expediente}", 'error')
                else:
                    flash(vs_resp, 'success')
            else:
                flash(vs_resp, 'error')
                session['bool_data'] = "true"
                session['form_data'] = request.form.to_dict(flat=True)
                session['form_data']['txtId'] = result_tuple[-1]

            flash(vs_dsc_resp, 'mensaje')

        except Exception as ex:
            flash('Error al procesar el formulario', 'error')
            flash(str(ex), 'error')
        
        return redirect(url_for('users.sy_usuarios'))

    usuarios = db.session.query(SyUsuarios).all()

    if session.get('bool_data') == "true":
        form_data = session.get('form_data')
        form = SyUsuariosForm(data=form_data)
    else:
        form = SyUsuariosForm()

    session.pop('bool_data', None)
    session.pop('form_data', None)

    return render_template('auth/sy_usuarios.html', form=form, usuarios=usuarios)

@users_bp.route('/admin_submenus', methods=['GET', 'POST'])
def admin_submenus():
    form = AdminSubmenusForm()
    if request.method == 'POST':
        try:
            session['bool_data'] = "false"
            opcion = form.opcion.data.upper()
            id_adminsubmenu = form.txtId.data.upper()
            submenu = form.txtIdSubmenu.data.upper()
            tp_rol = form.txtIdTpRol.data.upper()
            id_usr = "1".upper()

            # Ejecutar el procedimiento almacenado
            result = db.session.execute(
                text("CALL sp_menu_admin_submenus(:ve_opcion, :ve_id_adminsubmenu, :ve_submenu, :ve_tp_rol, :ve_id_usr, @vs_id_adminsubmenu, @vs_resp, @vs_dsc_resp, @vs_bool_resp)"),
                {'ve_opcion': opcion, 've_id_adminsubmenu': id_adminsubmenu, 've_submenu': submenu, 've_tp_rol': tp_rol, 've_id_usr': id_usr}
            )

            db.session.commit()

            # Recuperar los resultados de los parámetros de salida mediante una segunda consulta
            #result = db.session.execute(text("SELECT @vs_resp AS vs_resp, @vs_dsc_resp AS vs_dsc_resp, @vs_bool_resp AS vs_bool_resp, @vs_id_trno AS vs_id_trno"))
            result_tuple = result.first()

            vs_resp = result_tuple[-4]
            vs_dsc_resp = result_tuple[-3]
            vs_bool_resp = result_tuple[-2]

            if vs_bool_resp == 'true':
                flash(vs_resp, 'success')
            else:
                flash(vs_resp, 'error')
                session['bool_data'] = "true"
                session['form_data'] = request.form.to_dict(flat=True)
                session['form_data']['txtId'] = result_tuple[-1]

            flash(vs_dsc_resp, 'mensaje')

        except Exception as ex:
            flash('Error al procesar el formulario', 'error')
            flash(str(ex), 'error')
        
        return redirect(url_for('users.admin_submenus'))

    adminsubmenus = db.session.query(AdminSubmenus).all()

    if session.get('bool_data') == "true":
        form_data = session.get('form_data')
        form = AdminSubmenusForm(data=form_data)
    else:
        form = AdminSubmenusForm()

    session.pop('bool_data', None)
    session.pop('form_data', None)

    return render_template('auth/admin_submenus.html', form=form, adminsubmenus=adminsubmenus)


'''@users_bp.route('/estado_equipo')
def estado_equipo():
    user_id = current_user.id_usuario if current_user.is_authenticated else None
    if not user_id:
        flash("No hay usuario autenticado", "warning")
        return redirect(url_for('users.login'))

    user = SyUsuarios.query.get(user_id)
    detalle = DetUsuarios.query.filter_by(id_usuario=user_id).first()

    if not detalle:
        flash("No se encontró información del equipo", "error")
        return redirect(url_for('users.inicio'))

    ip = detalle.ip_ultima
    acceso = detalle.act_conexion
    hoy = datetime.now().date()
    accedio_hoy = acceso.date() == hoy

    return render_template("auth/estado_equipo.html", ip=ip, acceso=acceso, en_sesion=True, accedio_hoy=accedio_hoy)'''



'''@users_bp.route('/estado_equipo')
def estado_equipo():
    hoy = datetime.now().date()

    # Último acceso por IP (agrupado por ip_ultima)
    subquery = (
        db.session.query(
            BitAccesos.ip_ultima,
            db.func.max(BitAccesos.fecha_conexion).label("max_fecha")
        )
        .group_by(BitAccesos.ip_ultima)
        .subquery()
    )

    # Unimos para obtener los datos completos del último acceso por IP
    accesos = (
        db.session.query(BitAccesos)
        .join(subquery, (BitAccesos.ip_ultima == subquery.c.ip_ultima) & 
                        (BitAccesos.fecha_conexion == subquery.c.max_fecha))
        .all()
    )

    equipos = []
    for acceso in accesos:
        fecha_con = acceso.fecha_conexion.date()
        en_sesion = acceso.conexion_act.upper() == "EN SESIÓN"
        accedio_hoy = (fecha_con == hoy)

        estado = "activo" if en_sesion else "inactivo" if accedio_hoy else "desconectado"
        texto_estado = "EN SESIÓN" if en_sesion else "ACCESÓ HOY" if accedio_hoy else "DESCONECTADO"

        equipos.append({
            "ip": acceso.ip_ultima,
            "acceso": acceso.fecha_conexion,
            "estado": estado,
            "texto": texto_estado
        })

    return render_template("auth/estado_equipo.html", equipos=equipos)'''


'''@users_bp.route('/bitacora_equipos')
@login_required
def bitacora_equipos():
    hoy = datetime.now().date()

    subquery = db.session.query(
        BitAccesos.id_usuario,
        db.func.max(BitAccesos.id_acceso).label('max_id')
    ).group_by(BitAccesos.id_usuario).subquery()

    accesos = db.session.query(BitAccesos, SyUsuarios.usuario).join(
        subquery, BitAccesos.id_acceso == subquery.c.max_id
    ).join(
        SyUsuarios, BitAccesos.id_usuario == SyUsuarios.id_usuario
    ).all()

    equipos = []
    for acceso, usuario in accesos:
        fecha = acceso.fecha_conexion.date()
        if acceso.conexion_act == 'EN SESIÓN':
            estado = 'activo'
            mensaje = 'EN SESIÓN'
        elif fecha == hoy:
            estado = 'inactivo'
            mensaje = 'FUERA DE SESIÓN'
        else:
            estado = 'desconectado'
            mensaje = 'DESCONECTADO'

        equipos.append({
            'ip': acceso.ip_ultima,
            'fecha': acceso.fecha_conexion.strftime('%Y-%m-%d %H:%M:%S'),
            'estado': estado,
            'mensaje': mensaje,
            'usuario': usuario
        })

    return render_template('auth/bitacora_equipo.html', equipos=equipos)'''


@users_bp.route('/bitacora_equipos')
@login_required
def bitacora_equipos():
    hoy = datetime.now().date()

    subquery = db.session.query(
        BitAccesos.id_usuario,
        db.func.max(BitAccesos.id_acceso).label('max_id')
    ).group_by(BitAccesos.id_usuario).subquery()

    accesos = db.session.query(BitAccesos, SyUsuarios.usuario).join(
        subquery, BitAccesos.id_acceso == subquery.c.max_id
    ).join(
        SyUsuarios, BitAccesos.id_usuario == SyUsuarios.id_usuario
    ).all()

    equipos = []
    for acceso, usuario in accesos:
        fecha = acceso.fecha_conexion.date()
        if acceso.conexion_act == 'EN SESIÓN':
            estado = 'activo'
            mensaje = 'EN SESIÓN'
        elif fecha == hoy:
            estado = 'inactivo'
            mensaje = 'FUERA DE SESIÓN'
        else:
            estado = 'desconectado'
            mensaje = 'DESCONECTADO'

        equipos.append({
            'ip': acceso.ip_ultima,
            'fecha': acceso.fecha_conexion.strftime('%Y-%m-%d %H:%M:%S'),
            'estado': estado,
            'mensaje': mensaje,
            'usuario': usuario
        })

    return render_template('auth/bitacora_equipo.html', equipos=equipos)


@users_bp.errorhandler(404)
def page_not_found(e):
    return render_template("404.html"), 404


@users_bp.errorhandler(500)
def page_not_found(e):
    return render_template("500.html"), 500