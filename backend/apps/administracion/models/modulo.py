from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q


class Modulo(models.Model):
    """
    Catálogo de módulos de navegación (menú del sidebar), autorreferenciado.

    Cada fila representa un nodo del árbol de navegación (sección, ítem de
    panel o sub-ítem). La jerarquía se define vía `id_parent` y está limitada
    a `MAX_DEPTH` niveles para evitar árboles inmanejables en el sidebar.

    `es_sistema` marca nodos críticos (protegidos de ocultarse/moverse desde
    la UI de gestión de menús) por LISTA EXPLÍCITA de `clave` — no se deriva
    de `es_seccion` ni de `id_parent IS NULL`. La lista vive en
    `management/seeds/navigation_seed.py` (`CLAVES_SISTEMA`) y se reafirma en
    cada corrida de `seed_navigation_menu`; la migración `0005` la aplica una
    única vez sobre datos existentes. El bloqueo de escritura en sí (impedir
    ocultar/mover un módulo `es_sistema=True`) se implementa en la capa de
    policy/use case (Fase 2), no en este modelo.
    """

    class Grupo(models.TextChoices):
        PRIMARY = "primary", "Primary"
        SECONDARY = "secondary", "Secondary"

    MAX_DEPTH = 4

    id_modulo = models.BigAutoField(primary_key=True, db_column="id_modulo")
    clave = models.CharField(max_length=160, db_column="clave", unique=True)
    titulo = models.CharField(max_length=120, db_column="titulo")
    icono = models.CharField(max_length=60, db_column="icono", null=True, blank=True)
    url = models.CharField(max_length=255, db_column="url", null=True, blank=True)
    badge = models.CharField(max_length=30, db_column="badge", null=True, blank=True)
    orden = models.IntegerField(db_column="orden", default=0)
    es_seccion = models.BooleanField(db_column="es_seccion", default=False)
    es_sistema = models.BooleanField(db_column="es_sistema", default=False)
    grupo = models.CharField(
        max_length=20,
        db_column="grupo",
        choices=Grupo.choices,
        default=Grupo.PRIMARY,
    )
    id_parent = models.ForeignKey(
        "self",
        db_column="id_parent",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="hijos",
    )
    is_active = models.BooleanField(db_column="is_active", default=True)
    fch_alta = models.DateTimeField(db_column="fch_alta", auto_now_add=True)
    fch_modf = models.DateTimeField(db_column="fch_modf", null=True, blank=True)
    fch_baja = models.DateTimeField(db_column="fch_baja", null=True, blank=True)

    class Meta:
        db_table = "cat_modulos"
        managed = True
        ordering = ["orden", "titulo"]
        indexes = [
            models.Index(fields=["id_parent", "orden"], name="cat_modulos_parent_orden_idx"),
            models.Index(fields=["grupo", "es_seccion", "orden"], name="cat_modulos_grp_secc_ord_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=~Q(id_parent=F("id_modulo")),
                name="cat_modulos_no_self_parent",
            ),
        ]

    def __str__(self):
        return f"{self.clave} — {self.titulo}"

    def clean(self):
        """
        Valida que asignar `id_parent` no introduzca un ciclo ni una
        jerarquía de más de `MAX_DEPTH` niveles.

        Sube por la cadena de `id_parent` contando ancestros: si encuentra
        de nuevo `self` (ciclo) o si la cadena alcanza `MAX_DEPTH` ancestros
        (es decir, este módulo quedaría en el nivel `MAX_DEPTH + 1`), levanta
        `ValidationError`.

        NO valida la profundidad del subárbol de DESCENDIENTES: si `self`
        tiene hijos, moverlo puede empujarlos más allá de `MAX_DEPTH` sin que
        este método lo detecte (`clean()` solo mira la cadena de ancestros de
        `self`, no camina hacia abajo). Ese invariante se valida aparte, solo
        al mover un nodo, en `services/navigation_tree_validator.py`.
        """
        super().clean()
        if self.id_parent_id is None:
            return

        visited_ids = set()
        current = self.id_parent
        depth = 1
        while current is not None:
            if self.pk is not None and current.pk == self.pk:
                raise ValidationError(
                    {"id_parent": "La jerarquía de módulos no puede formar un ciclo."}
                )
            if current.pk in visited_ids:
                raise ValidationError(
                    {"id_parent": "La jerarquía de módulos no puede formar un ciclo."}
                )
            visited_ids.add(current.pk)
            if depth >= self.MAX_DEPTH:
                raise ValidationError(
                    {
                        "id_parent": (
                            f"La jerarquía de módulos no puede superar "
                            f"{self.MAX_DEPTH} niveles."
                        )
                    }
                )
            current = current.id_parent
            depth += 1
