from django.db import models

from apps.catalogos.models.base import CatalogBase


class CatUnidadMedida(CatalogBase):
    id_unidad_medida = models.BigAutoField(primary_key=True, db_column="id_unidad_medida")
    nombre      = models.CharField(max_length=100, unique=True)
    abreviacion = models.CharField(max_length=20)

    class Meta:
        db_table            = "almacen_cat_unidades_medida"
        ordering            = ["nombre"]
        verbose_name        = "Unidad de Medida"
        verbose_name_plural = "Unidades de Medida"

    def __str__(self) -> str:
        return f"{self.nombre} ({self.abreviacion})"


class CatCategoriaInsumo(CatalogBase):
    id_categoria = models.BigAutoField(primary_key=True, db_column="id_categoria")
    nombre      = models.CharField(max_length=150, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        db_table            = "almacen_cat_categorias_insumo"
        ordering            = ["nombre"]
        verbose_name        = "Categoría de Insumo"
        verbose_name_plural = "Categorías de Insumo"

    def __str__(self) -> str:
        return self.nombre


class CatProveedor(CatalogBase):
    id_proveedor = models.BigAutoField(primary_key=True, db_column="id_proveedor")
    nombre    = models.CharField(max_length=200)
    contacto  = models.CharField(max_length=150, blank=True)
    telefono  = models.CharField(max_length=20, blank=True)
    correo    = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    rfc       = models.CharField(max_length=15, blank=True)

    class Meta:
        db_table            = "almacen_cat_proveedores"
        ordering            = ["nombre"]
        verbose_name        = "Proveedor"
        verbose_name_plural = "Proveedores"

    def __str__(self) -> str:
        return self.nombre


class CatInsumo(CatalogBase):
    id_insumo          = models.BigAutoField(primary_key=True, db_column="id_insumo")
    nombre             = models.CharField(max_length=200)
    codigo             = models.CharField(max_length=50, unique=True)
    codigo_barras      = models.CharField(max_length=100, blank=True, db_index=True)
    descripcion        = models.TextField(blank=True)
    id_categoria       = models.ForeignKey(
        CatCategoriaInsumo,
        on_delete=models.PROTECT,
        db_column="id_categoria",
        related_name="insumos",
    )
    id_unidad          = models.ForeignKey(
        CatUnidadMedida,
        on_delete=models.PROTECT,
        db_column="id_unidad",
        related_name="insumos",
    )
    stock_minimo       = models.DecimalField(max_digits=12, decimal_places=4, default=0)
    requiere_lote      = models.BooleanField(default=False)
    requiere_caducidad = models.BooleanField(default=False)

    class Meta:
        db_table            = "almacen_cat_insumos"
        ordering            = ["nombre"]
        verbose_name        = "Insumo"
        verbose_name_plural = "Insumos"

    def __str__(self) -> str:
        return f"{self.codigo} — {self.nombre}"


class Almacen(CatalogBase):

    class Tipo(models.TextChoices):
        GENERAL     = "GENERAL",     "General"
        CONSULTORIO = "CONSULTORIO", "Consultorio"
        FARMACIA    = "FARMACIA",    "Farmacia"
        MEDICO      = "MEDICO",      "Médico"

    id_almacen         = models.BigAutoField(primary_key=True, db_column="id_almacen")
    nombre             = models.CharField(max_length=150)
    tipo               = models.CharField(max_length=20, choices=Tipo.choices, default=Tipo.GENERAL)
    id_centro_atencion = models.ForeignKey(
        "catalogos.CatCentroAtencion",
        on_delete=models.PROTECT,
        db_column="id_centro_atencion",
        related_name="almacenes_insumos",
    )
    descripcion        = models.TextField(blank=True)

    class Meta:
        db_table            = "almacen_almacenes"
        ordering            = ["nombre"]
        verbose_name        = "Almacén"
        verbose_name_plural = "Almacenes"

    def __str__(self) -> str:
        return f"{self.nombre} ({self.get_tipo_display()})"
