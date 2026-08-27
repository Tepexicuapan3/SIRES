import { useQuery } from "@tanstack/react-query";
import { visitsAPI } from "@api/resources/visits.api";

const SOMATOMETRIA_PACIENTE_HISTORIAL_KEY = "somatometria-paciente-historial";

export interface UseSomatometriaPacienteHistorialParams {
  noExp: string | undefined;
  pkNum: number | undefined;
  page?: number;
  pageSize?: number;
}

/**
 * Historial de un PACIENTE especifico (no de una fecha/centro, a diferencia
 * de `useSomatometriaHistorial`) -- D14, somatometria-modulo-integral.
 *
 * Reusa `GET /visits` filtrado por `noExp` + `pkNum` (dominio backend
 * `recepcion/visits-search`, D13): NO introduce ningun endpoint nuevo. El
 * orden `-id_visit` (mas reciente primero) es el default del backend
 * (`VisitRepository.list_paginated`), no se reordena aca.
 *
 * `enabled: Boolean(noExp)` -- sin expediente no hay nada que buscar (evita
 * un fetch inutil con `noExp=undefined`, ej. mientras el dialog todavia no
 * recibe props o el usuario cerro la ficha).
 */
export const useSomatometriaPacienteHistorial = (
  params: UseSomatometriaPacienteHistorialParams,
) => {
  const { noExp, pkNum, page = 1, pageSize = 50 } = params;

  return useQuery({
    queryKey: [
      SOMATOMETRIA_PACIENTE_HISTORIAL_KEY,
      noExp,
      pkNum,
      page,
      pageSize,
    ],
    queryFn: () =>
      visitsAPI.getAll({
        noExp,
        pkNum,
        page,
        pageSize,
      }),
    enabled: Boolean(noExp),
    staleTime: 30_000,
  });
};
