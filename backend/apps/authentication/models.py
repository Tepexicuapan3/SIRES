from django.db import models


class SyUsuario(models.Model):
    # Usuario principal para autenticacion.
    id_usuario = models.BigAutoField(primary_key=True, db_column="id_usuario")
    usuario = models.CharField(max_length=50, unique=True)
    correo = models.CharField(max_length=255, unique=True)
    clave_hash = models.CharField(max_length=255)
    est_activo = models.BooleanField(db_index=True, default=True)
    est_bloqueado = models.BooleanField(db_index=True, default=False)
    cambiar_clave = models.BooleanField(default=False)
    terminos_acept = models.BooleanField(default=False)
    fch_terminos = models.DateTimeField(null=True, blank=True)
    last_conexion = models.DateTimeField(null=True, blank=True, db_index=True)
    ip_ultima = models.GenericIPAddressField(null=True, blank=True)
    fch_alta = models.DateTimeField(auto_now_add=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    usr_alta = models.ForeignKey(
        "self",
        db_column="usr_alta",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios_creados",
    )
    usr_modf = models.ForeignKey(
        "self",
        db_column="usr_modf",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios_modificados",
    )
    usr_baja = models.ForeignKey(
        "self",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="usuarios_baja",
    )

    class Meta:
        db_table = "sy_usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.usuario

    @property
    def is_authenticated(self):
        # DRF espera esta propiedad en el user.
        return True


class DetUsuario(models.Model):
    # Perfil del usuario.
    id_usuario = models.OneToOneField(
        SyUsuario,
        db_column="id_usuario",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="detalle",
    )
    nombre = models.CharField(max_length=80)
    paterno = models.CharField(max_length=80)
    materno = models.CharField(max_length=80, null=True, blank=True)
    nombre_completo = models.CharField(max_length=255, db_index=True)
    id_centro_atencion = models.ForeignKey(
        "catalogos.CatCentroAtencion",
        db_column="id_centro_atencion",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    no_exp = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_column="no_exp",
    )
    id_area_clinica = models.ForeignKey(
        "catalogos.CatAreaClinica",
        db_column="id_area_clinica",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    cd_laboral = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_column="cd_laboral",
    )
    id_escolaridad = models.ForeignKey(
        "catalogos.Escolaridad",
        db_column="id_escolaridad",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    id_escuela = models.ForeignKey(
        "catalogos.Escuelas",
        db_column="id_escuela",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    telefono  = models.CharField(max_length=20,  null=True, blank=True, db_column="telefono")
    direccion = models.CharField(max_length=255, null=True, blank=True, db_column="direccion")
    sexo      = models.CharField(max_length=1,   null=True, blank=True, db_column="sexo",
                                  choices=[("M","Masculino"),("F","Femenino")])
    fecha_nac = models.DateField(null=True, blank=True, db_column="fecha_nac")
    tipo_personal = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_column="tipo_personal",
        choices=[
            ("MEDICO", "Médico"),
            ("ENFERMERIA", "Enfermería"),
            ("ADMINISTRATIVO", "Administrativo"),
        ],
    )

    class Meta:
        db_table = "det_usuarios"
        verbose_name = "Detalle Usuario"
        verbose_name_plural = "Detalles Usuarios"

    def __str__(self):
        return self.nombre_completo


class DetUsuarioCedula(models.Model):
    TIPO_PROFESIONAL = "PROFESIONAL"
    TIPO_ESPECIALIDAD = "ESPECIALIDAD"
    TIPO_SUBESPECIALIDAD = "SUBESPECIALIDAD"
    TIPO_CHOICES = [
        (TIPO_PROFESIONAL, "Cédula Profesional"),
        (TIPO_ESPECIALIDAD, "Cédula de Especialidad"),
        (TIPO_SUBESPECIALIDAD, "Cédula de Subespecialidad"),
    ]

    id = models.BigAutoField(primary_key=True)
    id_usuario = models.ForeignKey(
        SyUsuario,
        db_column="id_usuario",
        on_delete=models.CASCADE,
        related_name="cedulas",
    )
    numero = models.CharField(max_length=30, db_column="numero")
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_CHOICES,
        default=TIPO_PROFESIONAL,
        db_column="tipo",
    )
    es_principal = models.BooleanField(default=False, db_column="es_principal")
    orden = models.IntegerField(db_column="orden")

    class Meta:
        db_table = "det_usuario_cedulas"
        ordering = ["orden"]
        unique_together = [("id_usuario", "orden")]
        verbose_name = "Cédula de Usuario"
        verbose_name_plural = "Cédulas de Usuario"

    def __str__(self):
        return f"{self.tipo}: {self.numero}"
