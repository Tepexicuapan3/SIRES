from django.urls import path

from .views import *

routes = [
    ("care-centers", CentrosAtencionListCreateView, CentrosAtencionDetailView, "int"),
    ("areas", AreasListCreateView, AreasDetailView, "int"),
    ("authorizers", AutorizadoresListCreateView, AutorizadoresDetailView, "int"),
    ("discharge-reasons", BajasListCreateView, BajasDetailView, "int"),
    ("labor-quality", CalidadLaboralListCreateView, CalidadLaboralDetailView, "str"),
    ("consulting-rooms", ConsultoriosListCreateView, ConsultoriosDetailView, "int"),
    ("civil-status", EdoCivilListCreateView, EdoCivilDetailView, "int"),
    ("diseases", EnfermedadesListCreateView, EnfermedadesDetailView, "int"),
    ("education-level", EscolaridadListCreateView, EscolaridadDetailView, "int"),
    ("schools", EscuelasListCreateView, EscuelasDetailView, "int"),
    ("specialties", EspecialidadesListCreateView, EspecialidadesDetailView, "int"),
    ("med-studies", EstudiosMedListCreateView, EstudiosMedDetailView, "int"),
    ("med-groups", GruposDeMedicamentosListCreateView, GruposDeMedicamentosDetailView, "int"),
    ("occupations", OcupacionesListCreateView, OcupacionesDetailView, "int"),
    ("consultation-origins", OrigenConsListCreateView, OrigenConsDetailView, "str"),
    ("kinship", ParentescoListCreateView, ParentescoDetailView, "str"),
    ("passes", PasesListCreateView, PasesDetailView, "int"),
    ("permissions", PermisosListCreateView, PermisosDetailView, "int"),
    ("roles", RolesListCreateView, RolesDetailView, "int"),
    ("area-types", TiposAreasListCreateView, TiposAreasDetailView, "int"),
    ("auth-types", TpAutorizacionListCreateView, TpAutorizacionDetailView, "int"),
    ("appointment-types", TipoDeCitasListCreateView, TipoDeCitasDetailView, "int"),
    ("licenses", LicenciasListCreateView, LicenciasDetailView, "int"),
    ("blood-type", TiposSanguineoListCreateView, TiposSanguineoDetailView, "int"),
    ("shifts", TurnosListCreateView, TurnosDetailView, "int"),
]

urlpatterns = []
for base, list_view, detail_view, pk_type in routes:
    urlpatterns.append(path(base, list_view.as_view(), name=f"{base}-list-create"))
    urlpatterns.append(path(f"{base}/<{pk_type}:pk>", detail_view.as_view(), name=f"{base}-detail"))