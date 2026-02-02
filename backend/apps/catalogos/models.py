from django.db import models


class CatCentroAtencion(models.Model):
    id_centro_atencion = models.BigAutoField(primary_key=True, db_column="id_centro_atencion")
    nombre = models.CharField(max_length=120)
    folio = models.CharField(max_length=50, unique=True)
    es_externo = models.BooleanField(default=False)
    est_activo = models.BooleanField(db_index=True, default=True)
    direccion = models.CharField(max_length=255)
    horario = models.JSONField()
    fch_alta = models.DateTimeField(auto_now_add=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    usr_alta = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_alta",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="centros_creados",
    )
    usr_modf = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_modf",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="centros_modificados",
    )
    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="centros_baja",
    )

    class Meta:
        db_table = "cat_centros_atencion"
        verbose_name = "Centro Atencion"
        verbose_name_plural = "Centros Atencion"

    def __str__(self):
        return self.nombre


class CatRol(models.Model):
    id_rol = models.BigAutoField(primary_key=True, db_column="id_rol")
    rol = models.CharField(max_length=80, unique=True)
    desc_rol = models.CharField(max_length=255)
    landing_route = models.CharField(max_length=120, null=True, blank=True)
    is_admin = models.BooleanField(db_index=True, default=False)
    es_sistema = models.BooleanField(db_index=True, default=False)
    est_activo = models.BooleanField(db_index=True, default=True)
    fch_alta = models.DateTimeField(auto_now_add=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    usr_alta = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_alta",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="roles_creados",
    )
    usr_modf = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_modf",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="roles_modificados",
    )
    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="roles_baja",
    )

    class Meta:
        db_table = "cat_roles"
        verbose_name = "Rol"
        verbose_name_plural = "Roles"

    def __str__(self):
        return self.rol


class CatPermiso(models.Model):
    id_permiso = models.BigAutoField(primary_key=True, db_column="id_permiso")
    codigo = models.CharField(max_length=120, unique=True)
    descripcion = models.CharField(max_length=255)
    es_sistema = models.BooleanField(db_index=True, default=False)
    est_activo = models.BooleanField(db_index=True, default=True)
    fch_alta = models.DateTimeField(auto_now_add=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    usr_alta = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_alta",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="permisos_creados",
    )
    usr_modf = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_modf",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="permisos_modificados",
    )
    usr_baja = models.ForeignKey(
        "authentication.SyUsuario",
        db_column="usr_baja",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="permisos_baja",
    )

    class Meta:
        db_table = "cat_permisos"
        verbose_name = "Permiso"
        verbose_name_plural = "Permisos"

    def __str__(self):
        return self.codigo
