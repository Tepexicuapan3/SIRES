from app.models.herramientas import DetRoles
from app.models.administracion import DetRolesPersonalizados, UserRoles
from app.models.catalogos import CatMenus, CatSubMenus
######## Permisos de menu por usuario 

'''def obtener_permisos_usuario(id_usuario):
    roles = UserRoles.query.filter_by(id_usuario=id_usuario, est_usr_rol='A').all()
    
    # Verifica si el usuario es administrador
    es_admin = any(
        ur.rol.rol.upper() == 'ADMINISTRADOR' and ur.est_usr_rol == 'A'
        for ur in roles if ur.tp_asignacion == 'ROL' and ur.rol  # .rol es la relación con cat_roles
    )

    permisos = set()

    if es_admin:
        # Cargar todos los menús y submenús activos para administradores
        submenus = CatSubMenus.query.filter_by(est_submenu='A').all()
        for sm in submenus:
            permisos.add((sm.id_menu, sm.id_submenu))
    else:
        for ur in roles:
            if ur.tp_asignacion == 'ROL':
                det_roles = DetRoles.query.filter_by(id_rol=ur.id_rol, est_detrol='A').all()
                for dr in det_roles:
                    permisos.add((dr.id_menu, dr.id_submenu))
            elif ur.tp_asignacion == 'PERS':
                det_pers = DetRolesPersonalizados.query.filter_by(id_usuario=id_usuario, est_detpersonalizado='A').all()
                for dp in det_pers:
                    permisos.add((dp.id_menu, dp.id_submenu))

    menu_dict = {}
    for id_menu, id_submenu in permisos:
        if id_menu not in menu_dict:
            menu = CatMenus.query.filter_by(id_menu=id_menu, est_menu='A').first()
            if menu:
                menu_dict[id_menu] = {
                    'menu': menu.menu,
                    'submenus': []
                }

        submenu = CatSubMenus.query.filter_by(id_menu=id_menu, id_submenu=id_submenu, est_submenu='A').first()
        if submenu:
            menu_dict[id_menu]['submenus'].append({
                'nombre': submenu.submenu,
                'url': submenu.url.lower()
            })

    return menu_dict'''
###########################################################################################################
def obtener_permisos_usuario(id_usuario):
    roles = UserRoles.query.filter_by(id_usuario=id_usuario, est_usr_rol='A').all()
    
    # Verifica si el usuario es administrador
    es_admin = any(
        ur.rol.rol.upper() == 'ADMINISTRADOR' and ur.est_usr_rol == 'A'
        for ur in roles if ur.tp_asignacion == 'ROL' and ur.rol
    )

    permisos = set()

    if es_admin:
        submenus = CatSubMenus.query.filter_by(est_submenu='A').all()
        for sm in submenus:
            permisos.add((sm.id_menu, sm.id_submenu))
    else:
        for ur in roles:
            if ur.tp_asignacion == 'ROL':
                det_roles = DetRoles.query.filter_by(id_rol=ur.id_rol, est_detrol='A').all()
                for dr in det_roles:
                    permisos.add((dr.id_menu, dr.id_submenu))
            elif ur.tp_asignacion == 'PERS':
                det_pers = DetRolesPersonalizados.query.filter_by(id_usuario=id_usuario, est_detpersonalizado='A').all()
                for dp in det_pers:
                    permisos.add((dp.id_menu, dp.id_submenu))

    menu_dict = {}
    for id_menu, id_submenu in permisos:
        if id_menu not in menu_dict:
            menu = CatMenus.query.filter_by(id_menu=id_menu, est_menu='A').first()
            if menu:
                menu_dict[id_menu] = {
                    'menu': menu.menu,                   # Nombre corto del menú
                    'descripcion': menu.menu,
                    'clave_search': menu.clave_search,      # Nueva línea: descripción del menú
                    'submenus': []
                }

        submenu = CatSubMenus.query.filter_by(id_menu=id_menu, id_submenu=id_submenu, est_submenu='A').first()
        if submenu:
            menu_dict[id_menu]['submenus'].append({
                'nombre': submenu.submenu,
                'url': submenu.url.lower()
            })

    return menu_dict
########################################################################################################################

'''from flask import url_for, current_app

def obtener_permisos_usuario(id_usuario):
    roles = UserRoles.query.filter_by(id_usuario=id_usuario, est_usr_rol='A').all()

    # Verifica si el usuario es administrador
    es_admin = any(
        ur.rol.rol.upper() == 'ADMINISTRADOR' and ur.est_usr_rol == 'A'
        for ur in roles if ur.tp_asignacion == 'ROL' and ur.rol
    )

    permisos = set()

    if es_admin:
        submenus = CatSubMenus.query.filter_by(est_submenu='A').all()
        for sm in submenus:
            permisos.add((sm.id_menu, sm.id_submenu))
    else:
        for ur in roles:
            if ur.tp_asignacion == 'ROL':
                det_roles = DetRoles.query.filter_by(id_rol=ur.id_rol, est_detrol='A').all()
                for dr in det_roles:
                    permisos.add((dr.id_menu, dr.id_submenu))
            elif ur.tp_asignacion == 'PERS':
                det_pers = DetRolesPersonalizados.query.filter_by(id_usuario=id_usuario, est_detpersonalizado='A').all()
                for dp in det_pers:
                    permisos.add((dp.id_menu, dp.id_submenu))

    menu_dict = {}
    urls_permitidas = []

    # Construcción del diccionario de menús y recolección de URLs permitidas
    with current_app.app_context():
        for id_menu, id_submenu in permisos:
            if id_menu not in menu_dict:
                menu = CatMenus.query.filter_by(id_menu=id_menu, est_menu='A').first()
                if menu:
                    menu_dict[id_menu] = {
                        'menu': menu.menu,
                        'descripcion': menu.menu,
                        'clave_search': menu.clave_search,
                        'submenus': []
                    }

            submenu = CatSubMenus.query.filter_by(
                id_menu=id_menu,
                id_submenu=id_submenu,
                est_submenu='A'
            ).first()

            if submenu:
                endpoint = submenu.url
                try:
                    ruta = url_for(endpoint)
                    urls_permitidas.append(ruta)
                except Exception:
                    ruta = None  # Para que no se rompa si el endpoint no existe

                menu_dict[id_menu]['submenus'].append({
                    'nombre': submenu.submenu,
                    'url': submenu.url.lower()
                })

        # Obtener todas las rutas activas de la tabla
        urls_completas = []
        submenus_totales = CatSubMenus.query.filter_by(est_submenu='A').all()
        for submenu in submenus_totales:
            try:
                url = url_for(submenu.url)
                urls_completas.append(url)
            except Exception:
                continue

        # Calcular no permitidas
        urls_nopermitidas = list(set(urls_completas) - set(urls_permitidas))

    return {
        'permisos': menu_dict,
        'urls_permitidas': urls_permitidas,
        'urls_completas': urls_completas,
        'urls_nopermitidas': urls_nopermitidas
    }'''
