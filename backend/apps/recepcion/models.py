from django.db import models
from django.utils import timezone
import uuid


class Visit(models.Model):
    class ArrivalType(models.TextChoices):
        APPOINTMENT = "appointment", "appointment"
        WALK_IN = "walk_in", "walk_in"

    class ServiceType(models.TextChoices):
        MEDICINA_GENERAL = "medicina_general", "medicina_general"
        ESPECIALIDAD = "especialidad", "especialidad"
        URGENCIAS = "urgencias", "urgencias"

    id_visit = models.BigAutoField(primary_key=True, db_column="id_visit")
    # unique=True ya crea indice, no hace falta db_index=True
    folio = models.CharField(max_length=32, db_column="folio", unique=True)
    patient_id = models.BigIntegerField(db_column="patient_id", db_index=True)
    arrival_type = models.CharField(
        max_length=16,
        choices=ArrivalType.choices,
        db_column="arrival_type",
    )
    service_type = models.CharField(
        max_length=32,
        choices=ServiceType.choices,
        db_column="service_type",
        default=ServiceType.MEDICINA_GENERAL,
    )
    appointment_id = models.CharField(
        max_length=64,
        db_column="appointment_id",
        null=True,
        blank=True,
    )
    # correcto para filtro doctorId
    doctor_id = models.BigIntegerField(
        db_column="doctor_id",
        null=True,
        blank=True,
        db_index=True,
    )
    notes = models.CharField(
        max_length=255,
        db_column="notes",
        null=True,
        blank=True,
    )
    # dejamos db_index en el campo y quitamos el indice duplicado en Meta
    status = models.CharField(max_length=32, db_column="status", db_index=True)
    fch_alta = models.DateTimeField(auto_now_add=True, db_column="fch_alta")
    fch_modf = models.DateTimeField(auto_now=True, db_column="fch_modf")
    # baja logica: null cuando sigue activa
    fch_baja = models.DateTimeField(db_column="fch_baja", null=True, blank=True)
    
    class Meta:
        db_table = "rcp_visits"
        indexes = [
            models.Index(fields=["doctor_id", "status"], name="rcp_visits_doc_status_idx"),
            models.Index(fields=["fch_alta"], name="rcp_visits_fch_alta_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                name="rcp_visits_arrival_appointment_ck",
                condition=(
                    (
                        models.Q(arrival_type="appointment")
                        & models.Q(appointment_id__isnull=False)
                        & ~models.Q(appointment_id="")
                    )
                    | (
                        models.Q(arrival_type="walk_in")
                        & (models.Q(appointment_id__isnull=True) | models.Q(appointment_id=""))
                    )
                ),
            ),
        ]


####################################################### MODELO DE CITAS ##############################################################################
# ============================================================================
# TABLAS LEGACY / EXTERNAS
# ============================================================================
# Estas tablas existen en PostgreSQL y Django solo las lee.
# Recuerda que para leer algunas desde la BD "expedientes" necesitas DATABASE ROUTER
# o usar .using("expedientes") en consultas.
# ============================================================================


class CatClinica(models.Model):
    cd_clinica = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=100, db_column="nombre")

    class Meta:
        managed = False
        db_table = "cat_clinicas"
        app_label = "citas_medicas"

    def __str__(self):
        return self.nombre or f"Clínica {self.cd_clinica}"


class CatEmpleado(models.Model):
    """cat_empleados en BD expedientes."""

    no_exp = models.IntegerField(primary_key=True)
    ds_paterno = models.CharField(max_length=100, null=True, blank=True)
    ds_materno = models.CharField(max_length=100, null=True, blank=True)
    ds_nombre = models.CharField(max_length=100, null=True, blank=True)

    cve_cd_laboral = models.CharField(max_length=50, null=True, blank=True)
    cd_laboral = models.CharField(max_length=150, null=True, blank=True)

    ds_categoria = models.CharField(max_length=150, null=True, blank=True)

    cve_dir = models.CharField(max_length=50, null=True, blank=True)
    dir = models.CharField(max_length=150, null=True, blank=True)

    cve_ger = models.CharField(max_length=50, null=True, blank=True)
    gerencia = models.CharField(max_length=150, null=True, blank=True)

    cve_subger = models.CharField(max_length=50, null=True, blank=True)
    subgerencia = models.CharField(max_length=150, null=True, blank=True)

    cve_coord = models.CharField(max_length=50, null=True, blank=True)
    coordinacion = models.CharField(max_length=150, null=True, blank=True)

    fe_nac = models.DateField(null=True, blank=True)
    cd_sexo = models.CharField(max_length=1, null=True, blank=True)
    no_edad = models.IntegerField(null=True, blank=True)

    fe_ing = models.DateField(null=True, blank=True)
    fec_vig = models.DateField(null=True, blank=True)

    cd_clinica = models.IntegerField(null=True, blank=True)

    fec_baja = models.DateField(null=True, blank=True)
    cve_baja = models.CharField(max_length=50, null=True, blank=True)
    mot_baja = models.CharField(max_length=200, null=True, blank=True)

    alta_ac = models.DateTimeField(null=True, blank=True)
    hep_ac = models.DateTimeField(null=True, blank=True)
    hpp_ac = models.DateTimeField(null=True, blank=True)
    hpa_ac = models.DateTimeField(null=True, blank=True)
    hptn_ac = models.DateTimeField(null=True, blank=True)
    hpts_ac = models.DateTimeField(null=True, blank=True)
    emp_ac = models.DateTimeField(null=True, blank=True)

    rfc = models.CharField(max_length=20, null=True, blank=True)
    curp = models.CharField(max_length=20, null=True, blank=True)

    fec_ult_actualizacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "cat_empleados"
        app_label = "citas_medicas"

    @property
    def nombre_completo(self):
        return " ".join(
            p for p in [self.ds_nombre, self.ds_paterno, self.ds_materno] if p
        ).strip()

    @property
    def vigente(self):
        hoy = timezone.now().date()
        if self.fec_baja:
            return False
        if self.fec_vig:
            return self.fec_vig >= hoy
        return True

    def __str__(self):
        return f"{self.no_exp} - {self.nombre_completo}"


class CatFamiliar(models.Model):
    """
    cat_familiar en BD expedientes.

    Importante:
    - pk_num NO debe ser primary key.
    - El mejor candidato a PK aquí es cd_familiar.
    - no_expf = expediente del titular.
    - pk_num = 0 trabajador, >0 derechohabiente.
    """

    cd_familiar = models.IntegerField(primary_key=True)
    no_expf = models.IntegerField(db_index=True)
    tp_der = models.CharField(max_length=20, null=True, blank=True)

    ds_paterno = models.CharField(max_length=100, null=True, blank=True)
    ds_materno = models.CharField(max_length=100, null=True, blank=True)
    ds_nombre = models.CharField(max_length=100, null=True, blank=True)

    cd_parentesco = models.CharField(max_length=20, null=True, blank=True)

    fe_nac = models.DateField(null=True, blank=True)
    cd_sexo = models.CharField(max_length=2, null=True, blank=True)
    no_edad = models.IntegerField(null=True, blank=True)

    fe_ing = models.DateField(null=True, blank=True)
    fec_vig = models.DateField(null=True, blank=True)
    cd_clinica = models.IntegerField(null=True, blank=True)

    pk_num = models.IntegerField(null=True, blank=True, db_index=True)
    fec_ult_actualizacion = models.DateTimeField(null=True, blank=True)

    baja = models.IntegerField(null=True, blank=True, default=0)
    mot_baja = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        managed = False
        db_table = "cat_familiar"
        app_label = "citas_medicas"
        indexes = [
            models.Index(fields=["no_expf", "pk_num"], name="catfam_exp_pk_idx"),
        ]

    @property
    def nombre_completo(self):
        return " ".join(
            p for p in [self.ds_nombre, self.ds_paterno, self.ds_materno] if p
        ).strip()

    @property
    def es_trabajador(self):
        return self.pk_num == 0

    @property
    def vigente(self):
        hoy = timezone.now().date()
        if self.baja == 1:
            return False
        if self.fec_vig:
            return self.fec_vig >= hoy
        return True

    def __str__(self):
        return f"{self.no_expf}/{self.pk_num} - {self.nombre_completo}"


class DntFotoCredencial(models.Model):
    """dnt_fotos_credenciales en BD expedientes."""

    id_clave_foto = models.IntegerField(primary_key=True)
    id_empleado = models.CharField(max_length=20, db_index=True)  # no_exp como string
    tipo_foto = models.CharField(max_length=50, null=True, blank=True)
    foto = models.BinaryField(null=True, blank=True)
    fecha_toma = models.DateTimeField(null=True, blank=True)
    fec_actualizacion = models.DateTimeField(null=True, blank=True)
    pk_num = models.IntegerField(null=True, blank=True, default=0)

    class Meta:
        managed = False
        db_table = "dnt_fotos_credenciales"
        app_label = "citas_medicas"
        indexes = [
            models.Index(fields=["id_empleado", "pk_num"], name="foto_emp_pk_idx"),
        ]

    def __str__(self):
        return f"{self.id_empleado}/{self.pk_num} - {self.tipo_foto or 'foto'}"


class CatTurno(models.Model):
    id_trno = models.BigIntegerField(primary_key=True)
    turno = models.CharField(max_length=100, null=True, blank=True)
    est_activo = models.BooleanField(null=True, blank=True)
    fch_alta = models.DateTimeField(null=True, blank=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    usr_alta = models.BigIntegerField(null=True, blank=True)
    usr_modf = models.BigIntegerField(null=True, blank=True)
    usr_baja = models.BigIntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "cat_turnos"
        app_label = "citas_medicas"

    def __str__(self):
        return self.turno or f"Turno {self.id_trno}"


class CatCentroAtencion(models.Model):
    id_centro_atencion = models.BigIntegerField(primary_key=True)
    nombre = models.CharField(max_length=200, null=True, blank=True)
    folio = models.CharField(max_length=50, null=True, blank=True)
    es_externo = models.BooleanField(null=True, blank=True)
    est_activo = models.BooleanField(null=True, blank=True)
    direccion = models.CharField(max_length=300, null=True, blank=True)
    horario = models.JSONField(null=True, blank=True)

    fch_alta = models.DateTimeField(null=True, blank=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    usr_alta = models.BigIntegerField(null=True, blank=True)
    usr_modf = models.BigIntegerField(null=True, blank=True)
    usr_baja = models.BigIntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "cat_centros_atencion"
        app_label = "citas_medicas"

    def __str__(self):
        return self.nombre or f"Centro {self.id_centro_atencion}"


class CatConsultorio(models.Model):
    id_consult = models.BigIntegerField(primary_key=True)
    no_consult = models.IntegerField(null=True, blank=True)
    id_trno = models.BigIntegerField(null=True, blank=True)
    id_centro_atencion = models.BigIntegerField(null=True, blank=True, db_index=True)
    consult = models.CharField(max_length=100, null=True, blank=True)
    est_activo = models.BooleanField(null=True, blank=True)

    fch_alta = models.DateTimeField(null=True, blank=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)
    usr_alta = models.BigIntegerField(null=True, blank=True)
    usr_modf = models.BigIntegerField(null=True, blank=True)
    usr_baja = models.BigIntegerField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "cat_consultorios"
        app_label = "citas_medicas"

    def __str__(self):
        return self.consult or f"Consultorio {self.no_consult or self.id_consult}"


class CatMedicoClin(models.Model):
    """cat_medicosclin en la BD principal."""

    id_medclin = models.IntegerField(primary_key=True)
    id_usuario = models.IntegerField(null=True, blank=True)
    expediente = models.CharField(max_length=30, null=True, blank=True)

    paterno = models.CharField(max_length=80, null=True, blank=True)
    materno = models.CharField(max_length=80, null=True, blank=True)
    nombre = models.CharField(max_length=80, null=True, blank=True)

    sexo = models.CharField(max_length=1, null=True, blank=True)
    fch_nac = models.DateField(null=True, blank=True)

    cedula = models.CharField(max_length=50, null=True, blank=True)
    id_esc = models.IntegerField(null=True, blank=True)
    id_espec = models.IntegerField(null=True, blank=True)
    id_serviciosclin = models.IntegerField(null=True, blank=True)

    id_centro_atencion = models.BigIntegerField(null=True, blank=True, db_index=True)
    id_consult = models.BigIntegerField(null=True, blank=True)
    hr_ini = models.CharField(max_length=20, null=True, blank=True)
    hr_term = models.CharField(max_length=20, null=True, blank=True)
    interv_consul = models.IntegerField(null=True, blank=True)

    direccion = models.CharField(max_length=255, null=True, blank=True)
    dias = models.CharField(max_length=20, null=True, blank=True)
    ambos_turn = models.CharField(max_length=1, null=True, blank=True)

    id_consult2 = models.BigIntegerField(null=True, blank=True)
    hr_ini2 = models.CharField(max_length=20, null=True, blank=True)
    hr_term2 = models.CharField(max_length=20, null=True, blank=True)
    interv_consul2 = models.IntegerField(null=True, blank=True)

    est_medclin = models.CharField(max_length=2, null=True, blank=True)

    usr_alta = models.CharField(max_length=50, null=True, blank=True)
    fch_alta = models.DateTimeField(null=True, blank=True)
    usr_modf = models.CharField(max_length=50, null=True, blank=True)
    fch_modf = models.DateTimeField(null=True, blank=True)
    usr_baja = models.CharField(max_length=50, null=True, blank=True)
    fch_baja = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "cat_medicosclin"
        app_label = "citas_medicas"
        indexes = [
            models.Index(fields=["id_centro_atencion"], name="medclin_centro_idx"),
            models.Index(fields=["est_medclin"], name="medclin_status_idx"),
        ]

    @property
    def nombre_completo(self):
        nombre = " ".join(p for p in [self.nombre, self.paterno, self.materno] if p).strip()
        return f"Dr. {nombre}" if nombre else f"Médico {self.id_medclin}"

    @property
    def activo(self):
        return (self.est_medclin or "").upper() == "A"

    def __str__(self):
        return self.nombre_completo


# ============================================================================
# TABLAS NUEVAS GESTIONADAS POR DJANGO
# ============================================================================


class TipoPaciente(models.TextChoices):
    TRABAJADOR = "trabajador", "Trabajador"
    DERECHOHABIENTE = "derechohabiente", "Derechohabiente"


class EstatusCita(models.TextChoices):
    AGENDADA = "agendada", "Agendada"
    CONFIRMADA = "confirmada", "Confirmada"
    CANCELADA = "cancelada", "Cancelada"
    ATENDIDA = "atendida", "Atendida"
    NO_ASISTIO = "no_asistio", "No asistió"


class CitaMedica(models.Model):
    """
    Tabla central de citas.

    Reglas:
    - Trabajador: tipo_paciente=trabajador, no_exp=<no_exp>, pk_num=0
    - Derechohabiente: tipo_paciente=derechohabiente, no_exp=<no_expf>, pk_num=<pk_num>
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    tipo_paciente = models.CharField(
        max_length=20,
        choices=TipoPaciente.choices,
        db_index=True,
    )

    no_exp = models.IntegerField(db_index=True)
    pk_num = models.IntegerField(default=0, db_index=True)

    # referencias lógicas
    medico_id = models.IntegerField(db_index=True)
    centro_atencion_id = models.BigIntegerField(db_index=True)
    consultorio_id = models.BigIntegerField(db_index=True)

    fecha_hora = models.DateTimeField(db_index=True)

    estatus = models.CharField(
        max_length=20,
        choices=EstatusCita.choices,
        default=EstatusCita.AGENDADA,
        db_index=True,
    )

    motivo = models.TextField(blank=True, default="")
    observaciones = models.TextField(blank=True, default="")

    # snapshot histórico
    nombre_paciente = models.CharField(max_length=250)
    nombre_medico = models.CharField(max_length=250, blank=True, default="")
    nombre_centro = models.CharField(max_length=250, blank=True, default="")
    nombre_consult = models.CharField(max_length=100, blank=True, default="")

    creado_por = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "recepcion"
        db_table = "citas_medicas"
        ordering = ["-fecha_hora"]
        indexes = [
            models.Index(fields=["no_exp", "pk_num"], name="cita_paciente_idx"),
            models.Index(fields=["medico_id", "fecha_hora"], name="cita_medico_dt_idx"),
            models.Index(fields=["consultorio_id", "fecha_hora"], name="cita_consult_dt_idx"),
            models.Index(fields=["estatus", "fecha_hora"], name="cita_estatus_dt_idx"),
            models.Index(fields=["centro_atencion_id", "fecha_hora"], name="cita_centro_dt_idx"),
        ]
        constraints = [
            # evitar duplicidad de misma cita paciente+médico+hora, excepto canceladas
            models.UniqueConstraint(
                fields=["no_exp", "pk_num", "medico_id", "fecha_hora"],
                condition=~models.Q(estatus=EstatusCita.CANCELADA),
                name="unique_cita_paciente_medico"
            ),
            # evitar conflicto de consultorio a la misma hora, excepto canceladas
            models.UniqueConstraint(
                fields=["consultorio_id", "fecha_hora"],
                condition=~models.Q(estatus=EstatusCita.CANCELADA),
                name="unique_cita_consultorio_dt"
            ),
            # evitar doble agenda del mismo médico a la misma hora, excepto canceladas
            models.UniqueConstraint(
                fields=["medico_id", "fecha_hora"],
                condition=~models.Q(estatus=EstatusCita.CANCELADA),
                name="unique_cita_medico_dt"
            ),
        ]

    def __str__(self):
        return f"{self.nombre_paciente} - {self.fecha_hora:%Y-%m-%d %H:%M} [{self.estatus}]"


class CitaNotificacion(models.Model):
    class TipoNotif(models.TextChoices):
        CONFIRMACION = "confirmacion", "Confirmación de cita"
        RECORDATORIO = "recordatorio", "Recordatorio 24h"
        CANCELACION = "cancelacion", "Cancelación"
        TOKEN_CONFIRM = "token_confirm", "Token confirmación asistencia"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    cita = models.ForeignKey(
        CitaMedica,
        on_delete=models.CASCADE,
        related_name="notificaciones"
    )

    tipo = models.CharField(max_length=20, choices=TipoNotif.choices, db_index=True)
    email_destino = models.EmailField()
    enviado = models.BooleanField(default=False, db_index=True)
    error = models.TextField(blank=True, default="")

    token = models.UUIDField(default=uuid.uuid4, unique=True)
    token_usado = models.BooleanField(default=False, db_index=True)
    token_expira = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "recepcion"
        db_table = "citas_notificaciones"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["cita", "tipo"], name="notif_cita_tipo_idx"),
            models.Index(fields=["enviado", "created_at"], name="notif_envio_idx"),
        ]

    def __str__(self):
        return f"[{self.tipo}] {self.cita_id} -> {self.email_destino}"


class HorarioDisponible(models.Model):
    """
    Slots de disponibilidad generados desde cat_medicosclin.
    """

    id = models.BigAutoField(primary_key=True)

    medico_id = models.IntegerField(db_index=True)
    consultorio_id = models.BigIntegerField(db_index=True)
    centro_atencion_id = models.BigIntegerField(db_index=True)

    fecha_hora = models.DateTimeField(db_index=True)
    disponible = models.BooleanField(default=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "recepcion"
        db_table = "horarios_disponibles"
        constraints = [
            models.UniqueConstraint(
                fields=["medico_id", "fecha_hora"],
                name="unique_horario_medico_fecha"
            ),
        ]
        indexes = [
            models.Index(
                fields=["medico_id", "disponible", "fecha_hora"],
                name="horario_med_disp_idx"
            ),
            models.Index(
                fields=["consultorio_id", "fecha_hora"],
                name="horario_consult_dt_idx"
            ),
            models.Index(
                fields=["centro_atencion_id", "fecha_hora"],
                name="horario_centro_dt_idx"
            ),
        ]

    def __str__(self):
        estado = "Disponible" if self.disponible else "Ocupado"
        return f"{self.medico_id} - {self.fecha_hora:%Y-%m-%d %H:%M} - {estado}"