from django.db import models


class UnidadMedica(models.Model):

    nombre     = models.CharField(max_length=100)   # CUAUHTÉMOC
    servicio   = models.CharField(max_length=100)   # MEDICINA GENERAL
    direccion  = models.CharField(max_length=200)
    ciudad     = models.CharField(max_length=100)

    class Meta:
        db_table = "unidades_medicas"

    def __str__(self):
        return self.nombre


class Medico(models.Model):

    nombre       = models.CharField(max_length=150)
    dgp          = models.CharField(max_length=20)   # 6849373
    clave        = models.CharField(max_length=20)   # 37533
    cedula       = models.CharField(max_length=50, blank=True)
    especialidad = models.CharField(max_length=100, blank=True)
    institucion  = models.CharField(max_length=150, blank=True)  # IPN
    firma        = models.ImageField(upload_to='firmas/', null=True, blank=True)

    class Meta:
        db_table = "medicos"

    def __str__(self):
        return self.nombre


class Paciente(models.Model):

    TIPO_CHOICES = [
        ('TRABAJADOR', 'Trabajador'),
        ('FAMILIAR',   'Familiar'),
        ('PENSIONADO', 'Pensionado'),
    ]

    nombre            = models.CharField(max_length=100)
    apellido_paterno  = models.CharField(max_length=100)
    apellido_materno  = models.CharField(max_length=100)
    fecha_nacimiento  = models.DateField()               # reemplaza edad
    expediente        = models.CharField(max_length=50)
    tipo              = models.CharField(max_length=20, choices=TIPO_CHOICES, default='TRABAJADOR')
    sexo              = models.CharField(max_length=10, blank=True)
    telefono          = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = "pacientes"

    def __str__(self):
        return f"{self.apellido_paterno} {self.apellido_materno} {self.nombre}"


class Medicamento(models.Model):

    nombre = models.CharField(max_length=200)
    clave  = models.CharField(max_length=50)   # 7500771166133

    class Meta:
        db_table = "medicamentos"

    def __str__(self):
        return self.nombre


class Receta(models.Model):

    numero         = models.CharField(max_length=20)   # CR24-7887
    paciente       = models.ForeignKey(Paciente,    on_delete=models.CASCADE)
    medico         = models.ForeignKey(Medico,      on_delete=models.CASCADE)
    unidad_medica  = models.ForeignKey(UnidadMedica, on_delete=models.CASCADE)
    fecha          = models.DateTimeField(auto_now_add=True)
    diagnostico    = models.TextField(blank=True)

    class Meta:
        db_table = "recetas"

    def __str__(self):
        return f"{self.numero} - {self.paciente}"


class RecetaDetalle(models.Model):

    receta      = models.ForeignKey(
        Receta,
        on_delete=models.CASCADE,
        related_name="detalles"       # receta.detalles.all()
    )
    medicamento  = models.ForeignKey(Medicamento, on_delete=models.CASCADE)
    cantidad     = models.IntegerField(default=1)
    dosis        = models.CharField(max_length=100, blank=True)
    frecuencia   = models.CharField(max_length=100, blank=True)
    duracion     = models.CharField(max_length=100, blank=True)
    indicaciones = models.CharField(max_length=255)  # "TOMAR 1TAB CADA SEMANA POR 1MES"

    class Meta:
        db_table = "receta_detalle"

    def __str__(self):
        return f"{self.medicamento} - {self.indicaciones}"