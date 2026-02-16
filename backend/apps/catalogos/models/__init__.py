from .base import CatalogBase

from .areas import Areas
from .autorizadores import Autorizadores
from .bajas import Bajas
from .calidad_laboral import CalidadLaboral
from .centros_atencion import CatCentroAtencion
from .consultorios import Consultorios
from .edo_civil import EdoCivil
from .enfermedades import Enfermedades
from .escolaridad import Escolaridad
from .escuelas import Escuelas
from .especialidades import Especialidades
from .estudios_medicos import EstudiosMed
from .grupos_medicamentos import GruposDeMedicamentos
from .ocupaciones import Ocupaciones
from .origen_consulta import OrigenCons
from .parentescos import Parentesco
from .pases import Pases

# 🔑 ALIAS IMPORTANTES
from .roles import Roles as CatRol
from .permisos import Permisos as CatPermiso

from .tipos_areas import TiposAreas
from .tipos_autorizacion import TpAutorizacion
from .tipos_citas import TipoDeCitas
from .tipos_licencias import Licencias
from .tipos_sanguineo import TiposSanguineo
from .turnos import Turnos


__all__ = [
    "CatalogBase",
    "Areas",
    "Autorizadores",
    "Bajas",
    "CalidadLaboral",
    "CatCentroAtencion",
    "Consultorios",
    "EdoCivil",
    "Enfermedades",
    "Escolaridad",
    "Escuelas",
    "Especialidades",
    "EstudiosMed",
    "GruposDeMedicamentos",
    "Ocupaciones",
    "OrigenCons",
    "Parentesco",
    "Pases",
    "CatRol",        # 👈 alias
    "CatPermiso",    # 👈 alias
    "TiposAreas",
    "TpAutorizacion",
    "TipoDeCitas",
    "Licencias",
    "TiposSanguineo",
    "Turnos",
]
