from django.db import models
from django.utils import timezone


class DetUsuarioMedico(models.Model):
    """Perfil profesional exclusivo para usuarios de tipo MEDICO."""

    id_usuario = models.OneToOneField(
        "authentication.SyUsuario",
        db_column="id_usuario",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="perfil_medico",
    )
    cedula_profesional = models.CharField(max_length=30, null=True, blank=True)
    cedula_especialidad = models.CharField(max_length=30, null=True, blank=True)
    id_especialidad = models.ForeignKey(
        "catalogos.Especialidades",
        db_column="id_especialidad",
        db_constraint=False,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    tipo_adscripcion = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=[
            ("CLINICA", "Clínica"),
            ("HOSPITAL", "Hospital"),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    created_by_id = models.BigIntegerField(null=True, blank=True)
    updated_by_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "det_usuario_medico"
        verbose_name = "Perfil Médico"
        verbose_name_plural = "Perfiles Médicos"

    def __str__(self):
        return f"Médico: {self.id_usuario.usuario}"


class DetUsuarioEnfermeria(models.Model):
    """Perfil profesional exclusivo para usuarios de tipo ENFERMERIA."""

    NIVEL_GENERAL = "GENERAL"
    NIVEL_ESPECIALISTA = "ESPECIALISTA"
    NIVEL_JEFE = "JEFE_PISO"
    NIVEL_CHOICES = [
        (NIVEL_GENERAL, "General"),
        (NIVEL_ESPECIALISTA, "Especialista"),
        (NIVEL_JEFE, "Jefe de Piso"),
    ]

    id_usuario = models.OneToOneField(
        "authentication.SyUsuario",
        db_column="id_usuario",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="perfil_enfermeria",
    )
    cedula_enfermeria = models.CharField(max_length=30, null=True, blank=True)
    nivel = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=NIVEL_CHOICES,
    )
    id_area_clinica = models.ForeignKey(
        "catalogos.CatAreaClinica",
        db_column="id_area_clinica",
        db_constraint=False,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    created_by_id = models.BigIntegerField(null=True, blank=True)
    updated_by_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "det_usuario_enfermeria"
        verbose_name = "Perfil Enfermería"
        verbose_name_plural = "Perfiles Enfermería"

    def __str__(self):
        return f"Enfermería: {self.id_usuario.usuario}"


class DetUsuarioAdministrativo(models.Model):
    """Perfil exclusivo para usuarios de tipo ADMINISTRATIVO."""

    id_usuario = models.OneToOneField(
        "authentication.SyUsuario",
        db_column="id_usuario",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="perfil_administrativo",
    )
    puesto = models.CharField(max_length=100, null=True, blank=True)
    area_administrativa = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True, blank=True)
    created_by_id = models.BigIntegerField(null=True, blank=True)
    updated_by_id = models.BigIntegerField(null=True, blank=True)

    class Meta:
        db_table = "det_usuario_administrativo"
        verbose_name = "Perfil Administrativo"
        verbose_name_plural = "Perfiles Administrativos"

    def __str__(self):
        return f"Administrativo: {self.id_usuario.usuario}"
