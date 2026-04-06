// frontend/src/features/recepcion/modules/citas/components/NuevaCitaDialog.tsx

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  crearCitaSchema,
  type CrearCitaFormInput,
  type CrearCitaFormValues,
} from "../domain/citas.schemas";
import { useCrearCita } from "../mutations/useCrearCita";
import type { NucleoFamiliar, Paciente, SlotDisponible } from "../types/citas.types";
import { getDisponibilidad, getNucleoFamiliar } from "@/api/resources/citas.api";

interface NuevaCitaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CrearCitaFormInput = {
  no_exp: 0,
  tipo_paciente: "trabajador",
  pk_num: 0,
  medico_id: 0,
  centro_atencion_id: 0,
  consultorio_id: 0,
  fecha_hora: "",
  motivo: "",
  email_notificacion: "",
};

export const NuevaCitaDialog = ({ open, onOpenChange }: NuevaCitaDialogProps) => {
  const crearCita = useCrearCita();

  const [expedienteBusqueda, setExpedienteBusqueda] = useState("");
  const [nucleo, setNucleo] = useState<NucleoFamiliar | null>(null);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [loadingNucleo, setLoadingNucleo] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorNucleo, setErrorNucleo] = useState<string | null>(null);
  const [errorSlots, setErrorSlots] = useState<string | null>(null);

  const form = useForm<CrearCitaFormInput, unknown, CrearCitaFormValues>({
    resolver: zodResolver(crearCitaSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = form;

  const isSubmitting = crearCita.isPending;

  //const tipoPaciente = watch("tipo_paciente");
  const medicoId = watch("medico_id");
  const consultorioId = watch("consultorio_id");
  const fechaHoraSeleccionada = watch("fecha_hora");
  const noExp = watch("no_exp");
  const pkNum = watch("pk_num");

  useEffect(() => {
    if (!open) return;
    reset(DEFAULT_VALUES);
    setExpedienteBusqueda("");
    setNucleo(null);
    setSlots([]);
    setErrorNucleo(null);
    setErrorSlots(null);
  }, [open, reset]);

  const pacientes = useMemo(() => {
    if (!nucleo) return [] as Paciente[];
    return [
      ...(nucleo.trabajador ? [nucleo.trabajador] : []),
      ...nucleo.derechohabientes,
    ];
  }, [nucleo]);

  const pacienteSeleccionado = useMemo(() => {
    return pacientes.find((p) => p.no_exp === noExp && p.pk_num === pkNum) ?? null;
  }, [pacientes, noExp, pkNum]);

  const buscarNucleo = async () => {
    const expediente = Number(expedienteBusqueda);
    if (!expediente || expediente <= 0) {
      setErrorNucleo("Ingresa un expediente válido.");
      setNucleo(null);
      return;
    }

    try {
      setLoadingNucleo(true);
      setErrorNucleo(null);
      setNucleo(null);
      setSlots([]);
      setErrorSlots(null);

      const data = await getNucleoFamiliar(expediente);
      setNucleo(data);
      console.log("foto_b64:", data.trabajador?.foto_b64?.slice(0, 60) ?? "NULL");  // ← temporal


      if (data.trabajador) {
        setValue("no_exp", data.trabajador.no_exp, { shouldValidate: true });
        setValue("tipo_paciente", "trabajador", { shouldValidate: true });
        setValue("pk_num", 0, { shouldValidate: true });
      }
    } catch (error) {
      setErrorNucleo("No se encontró el expediente o no fue posible cargar el núcleo familiar.");
      setNucleo(null);
    } finally {
      setLoadingNucleo(false);
    }
  };

  const seleccionarPaciente = (paciente: Paciente) => {
    setValue("no_exp", paciente.no_exp, { shouldValidate: true, shouldDirty: true });
    setValue("tipo_paciente", paciente.tipo, { shouldValidate: true, shouldDirty: true });
    setValue("pk_num", paciente.pk_num, { shouldValidate: true, shouldDirty: true });
  };

  const cargarDisponibilidad = async () => {
    const medico_id = Number(getValues("medico_id"));
    const consultorio_id = Number(getValues("consultorio_id"));

    if (!medico_id || medico_id <= 0) {
      setErrorSlots("Ingresa un médico válido.");
      setSlots([]);
      return;
    }

    if (!consultorio_id || consultorio_id <= 0) {
      setErrorSlots("Ingresa un consultorio válido.");
      setSlots([]);
      return;
    }

    try {
      setLoadingSlots(true);
      setErrorSlots(null);
      setSlots([]);
      setValue("fecha_hora", "", { shouldValidate: true });

      const hoy = new Date();
      const inicio = hoy.toISOString().slice(0, 10);

      const finDate = new Date();
      finDate.setDate(finDate.getDate() + 30);
      const fin = finDate.toISOString().slice(0, 10);

      const data = await getDisponibilidad({
        medico_id,
        fecha_inicio: inicio,
        fecha_fin: fin,
      });

      const filtrados = data.filter(
        (slot) => Number(slot.consultorio_id) === consultorio_id
      );

      setValue(
        "centro_atencion_id",
        filtrados[0]?.centro_atencion_id ?? getValues("centro_atencion_id"),
        { shouldValidate: true, shouldDirty: true }
      );

      setSlots(filtrados);
      if (!filtrados.length) {
        setErrorSlots("No hay horarios disponibles para ese médico y consultorio.");
      }
    } catch (error) {
      setErrorSlots("No fue posible consultar la disponibilidad.");
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const seleccionarSlot = (slot: SlotDisponible) => {
    setValue("fecha_hora", slot.fecha_hora, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    setValue("consultorio_id", Number(slot.consultorio_id), {
      shouldValidate: true,
      shouldDirty: true,
    });
    setValue("centro_atencion_id", Number(slot.centro_atencion_id), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (values: CrearCitaFormValues) => {
    try {
      await crearCita.mutateAsync(values);
      onOpenChange(false);
      reset(DEFAULT_VALUES);
      setExpedienteBusqueda("");
      setNucleo(null);
      setSlots([]);
    } catch {
      // el mutation hook ya maneja el toast/error
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nueva cita médica</DialogTitle>
          <DialogDescription>
            Busca el expediente, elige al paciente, selecciona médico, consultorio y horario disponible.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-3 rounded-md border p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="buscar-expediente">Expediente</Label>
                <Input
                  id="buscar-expediente"
                  type="number"
                  value={expedienteBusqueda}
                  disabled={loadingNucleo || isSubmitting}
                  onChange={(e) => setExpedienteBusqueda(e.target.value)}
                  placeholder="Ej. 12345"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={buscarNucleo}
                  disabled={loadingNucleo || isSubmitting}
                >
                  {loadingNucleo ? "Buscando..." : "Buscar expediente"}
                </Button>
              </div>
            </div>

            {errorNucleo ? (
              <p className="text-sm text-status-critical" role="alert">
                {errorNucleo}
              </p>
            ) : null}

            {pacientes.length ? (
              <div className="space-y-2">
                <Label>Selecciona paciente</Label>
                <div className="grid gap-2 md:grid-cols-2">
                  {pacientes.map((paciente) => {
                    const activo =
                      paciente.no_exp === noExp && paciente.pk_num === pkNum;

                    return (
                      <button
                        key={`${paciente.no_exp}-${paciente.pk_num}`}
                        type="button"
                        onClick={() => seleccionarPaciente(paciente)}
                        disabled={isSubmitting}
                        className={`rounded-md border p-3 text-left ${
                          activo ? "border-primary ring-1 ring-primary" : "border-line-struct"
                        } ${!paciente.vigente ? "opacity-60" : ""}`}
                      >
                        <div className="font-medium">{paciente.nombre_completo}</div>
                        <div className="text-sm text-muted-foreground">
                          {paciente.tipo === "trabajador"
                            ? "Trabajador"
                            : `Derechohabiente${paciente.parentesco ? ` · ${paciente.parentesco}` : ""}`}
                        </div>
                        <div className="text-sm">
                          {paciente.vigente ? "Vigente" : "Sin vigencia"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-3 rounded-md border p-4">
            <div className="text-sm font-medium">Paciente seleccionado</div>

            {pacienteSeleccionado ? (
              <div className="grid gap-3 md:grid-cols-[96px_1fr]">
                <div className="flex h-30 w-25 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {pacienteSeleccionado.foto_b64 ? (
                    <img
                      src={pacienteSeleccionado.foto_b64}
                      alt={pacienteSeleccionado.nombre_completo}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin foto</span>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-medium">{pacienteSeleccionado.nombre_completo}</div>
                  <div className="text-sm text-muted-foreground">
                    Expediente {pacienteSeleccionado.no_exp} · pk_num {pacienteSeleccionado.pk_num}
                  </div>
                  <div className="text-sm">
                    {pacienteSeleccionado.tipo === "trabajador"
                      ? "Trabajador"
                      : "Derechohabiente"}
                  </div>
                  <div className="text-sm">
                    {pacienteSeleccionado.vigente ? "Vigente" : "Sin vigencia"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Primero busca el expediente y selecciona al paciente.
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-md border p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cita-medico_id">ID médico</Label>
                <Input
                  id="cita-medico_id"
                  type="number"
                  min={1}
                  disabled={isSubmitting}
                  {...register("medico_id", { valueAsNumber: true })}
                />
                {errors.medico_id?.message ? (
                  <p className="text-sm text-status-critical" role="alert">
                    {errors.medico_id.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cita-consultorio_id">ID consultorio</Label>
                <Input
                  id="cita-consultorio_id"
                  type="number"
                  min={1}
                  disabled={isSubmitting}
                  {...register("consultorio_id", { valueAsNumber: true })}
                />
                {errors.consultorio_id?.message ? (
                  <p className="text-sm text-status-critical" role="alert">
                    {errors.consultorio_id.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cita-centro_atencion_id">ID centro</Label>
                <Input
                  id="cita-centro_atencion_id"
                  type="number"
                  min={1}
                  disabled={isSubmitting}
                  {...register("centro_atencion_id", { valueAsNumber: true })}
                />
                {errors.centro_atencion_id?.message ? (
                  <p className="text-sm text-status-critical" role="alert">
                    {errors.centro_atencion_id.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <Button
                type="button"
                variant="outline"
                onClick={cargarDisponibilidad}
                disabled={
                  isSubmitting ||
                  loadingSlots ||
                  !medicoId ||
                  !consultorioId ||
                  !pacienteSeleccionado
                }
              >
                {loadingSlots ? "Consultando horarios..." : "Ver horarios disponibles"}
              </Button>
            </div>

            {errorSlots ? (
              <p className="text-sm text-status-critical" role="alert">
                {errorSlots}
              </p>
            ) : null}

            {!!slots.length ? (
              <div className="space-y-2">
                <Label>Horarios disponibles</Label>
                <div className="grid max-h-56 gap-2 overflow-auto md:grid-cols-2">
                  {slots.map((slot) => {
                    const activo = fechaHoraSeleccionada === slot.fecha_hora;
                    const fecha = new Date(slot.fecha_hora);

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => seleccionarSlot(slot)}
                        disabled={isSubmitting}
                        className={`rounded-md border p-3 text-left text-sm ${
                          activo ? "border-primary ring-1 ring-primary" : "border-line-struct"
                        }`}
                      >
                        <div className="font-medium">
                          {fecha.toLocaleDateString()}
                        </div>
                        <div>{fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        <div className="text-muted-foreground">
                          Consultorio {slot.consultorio_id}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {errors.fecha_hora?.message ? (
              <p className="text-sm text-status-critical" role="alert">
                {errors.fecha_hora.message}
              </p>
            ) : null}
          </section>

          <section className="space-y-3 rounded-md border p-4">
            <div className="space-y-2">
              <Label htmlFor="cita-motivo">Motivo</Label>
              <Textarea
                id="cita-motivo"
                rows={2}
                disabled={isSubmitting}
                {...register("motivo")}
              />
              {errors.motivo?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {errors.motivo.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cita-email">Correo para enviar PDF y notificaciones</Label>
              <Input
                id="cita-email"
                type="email"
                placeholder="correo@ejemplo.com"
                disabled={isSubmitting}
                {...register("email_notificacion")}
              />
              {errors.email_notificacion?.message ? (
                <p className="text-sm text-status-critical" role="alert">
                  {errors.email_notificacion.message}
                </p>
              ) : null}
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !pacienteSeleccionado || !fechaHoraSeleccionada}
            >
              {isSubmitting ? "Agendando..." : "Confirmar cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};