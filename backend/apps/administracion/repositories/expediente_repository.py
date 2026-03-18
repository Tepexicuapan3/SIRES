from apps.administracion.models.empleado import CatEmpleado
from apps.administracion.models.familiar import CatFamiliar
from apps.administracion.models.foto_credencial import DntFotosCredenciales


class ExpedienteRepository:

    @staticmethod
    def obtener_empleado(exp):
        return CatEmpleado.objects.filter(
            no_exp=exp
        ).first()

    @staticmethod
    def obtener_familiares(exp):
        return CatFamiliar.objects.filter(
            no_expf=exp
        )

    @staticmethod
    def obtener_foto(exp):
        return DntFotosCredenciales.objects.filter(
            id_empleado=exp
        ).first()
