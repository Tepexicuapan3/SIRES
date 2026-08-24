from apps.administracion.models import Modulo


def _serialize_item(node):
    modulo = node["modulo"]
    item = {
        "title": modulo.titulo,
        "icon": modulo.icono,
        "url": modulo.url,
        "badge": modulo.badge,
        "permissions": node["permissions"],
    }
    if node["items"]:
        item["items"] = [_serialize_item(child) for child in node["items"]]
    return item


def _serialize_section(node):
    modulo = node["modulo"]
    return {
        "title": modulo.titulo,
        "icon": modulo.icono,
        "permissions": node["permissions"],
        "items": [_serialize_item(child) for child in node["items"]],
    }


def serialize_navigation_menu(tree, *, source):
    sections = []
    secondary_items = []

    for node in tree:
        modulo = node["modulo"]
        if modulo.grupo == Modulo.Grupo.SECONDARY:
            secondary_items.append(_serialize_item(node))
        else:
            sections.append(_serialize_section(node))

    return {
        "source": source,
        "sections": sections,
        "secondaryItems": secondary_items,
    }


def _serialize_module_node(node):
    modulo = node["modulo"]
    return {
        "id": modulo.id_modulo,
        "key": modulo.clave,
        "title": modulo.titulo,
        "icon": modulo.icono,
        "url": modulo.url,
        "orden": modulo.orden,
        "group": modulo.grupo,
        "isSection": modulo.es_seccion,
        "isSystem": modulo.es_sistema,
        "isActive": modulo.is_active,
        "parentKey": modulo.id_parent.clave if modulo.id_parent_id else None,
        "permissions": node["permissions"],
        "items": [_serialize_module_node(child) for child in node["items"]],
    }


def serialize_module_catalog(tree):
    """
    Arbol PLANO en una sola lista raiz (sin split sections/secondaryItems
    como en el menu de navegacion): el admin del catalogo de permisos ve
    TODO el arbol tal cual esta modelado en BD.
    """
    return {"modules": [_serialize_module_node(node) for node in tree]}


def serialize_module_summary(modulo, *, permissions=None):
    """
    Serializacion PLANA (sin hijos) de un unico `Modulo` -- la usan las
    respuestas de create/update/hide/restore (no arrastran el arbol
    completo, a diferencia de `serialize_module_catalog`). Mismos nombres
    de campo que `_serialize_module_node` para que el frontend reciba una
    forma consistente sin importar el endpoint.
    """
    return {
        "id": modulo.id_modulo,
        "key": modulo.clave,
        "title": modulo.titulo,
        "icon": modulo.icono,
        "url": modulo.url,
        "badge": modulo.badge,
        "orden": modulo.orden,
        "group": modulo.grupo,
        "isSection": modulo.es_seccion,
        "isSystem": modulo.es_sistema,
        "isActive": modulo.is_active,
        "parentKey": modulo.id_parent.clave if modulo.id_parent_id else None,
        "permissions": permissions if permissions is not None else [],
    }
