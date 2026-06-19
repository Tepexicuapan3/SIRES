import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  almacenesAPI,
  categoriasInsumoAPI,
  insumosAPI,
  proveedoresAPI,
  unidadesMedidaAPI,
} from "@api/resources/almacen/catalogos.api";
import type {
  CreateAlmacenRequest,
  CreateCategoriaInsumoRequest,
  CreateInsumoRequest,
  CreateProveedorRequest,
  CreateUnidadMedidaRequest,
  UpdateAlmacenRequest,
  UpdateCategoriaInsumoRequest,
  UpdateInsumoRequest,
  UpdateProveedorRequest,
  UpdateUnidadMedidaRequest,
} from "@api/types";
import {
  almacenesKeys,
  categoriasInsumoKeys,
  insumosKeys,
  proveedoresKeys,
  unidadesMedidaKeys,
} from "../queries/catalogos.keys";

// ── Unidades de medida ────────────────────────────────────────────────────────

export const useCreateUnidadMedida = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUnidadMedidaRequest) => unidadesMedidaAPI.create(data),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: unidadesMedidaKeys.all }); },
  });
};

export const useUpdateUnidadMedida = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUnidadMedidaRequest }) =>
      unidadesMedidaAPI.update(id, data),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: unidadesMedidaKeys.all }); },
  });
};

export const useDeleteUnidadMedida = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unidadesMedidaAPI.delete(id),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: unidadesMedidaKeys.all }); },
  });
};

// ── Categorías ────────────────────────────────────────────────────────────────

export const useCreateCategoriaInsumo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoriaInsumoRequest) => categoriasInsumoAPI.create(data),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: categoriasInsumoKeys.all }); },
  });
};

export const useUpdateCategoriaInsumo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoriaInsumoRequest }) =>
      categoriasInsumoAPI.update(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: categoriasInsumoKeys.all }); },
  });
};

export const useDeleteCategoriaInsumo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriasInsumoAPI.delete(id),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: categoriasInsumoKeys.all }); },
  });
};

// ── Proveedores ───────────────────────────────────────────────────────────────

export const useCreateProveedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProveedorRequest) => proveedoresAPI.create(data),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: proveedoresKeys.all }); },
  });
};

export const useUpdateProveedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProveedorRequest }) =>
      proveedoresAPI.update(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: proveedoresKeys.all }); },
  });
};

export const useDeleteProveedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => proveedoresAPI.delete(id),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: proveedoresKeys.all }); },
  });
};

// ── Insumos ───────────────────────────────────────────────────────────────────

export const useCreateInsumo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInsumoRequest) => insumosAPI.create(data),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: insumosKeys.all }); },
  });
};

export const useUpdateInsumo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInsumoRequest }) =>
      insumosAPI.update(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: insumosKeys.all }); },
  });
};

export const useDeleteInsumo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => insumosAPI.delete(id),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: insumosKeys.all }); },
  });
};

// ── Almacenes ─────────────────────────────────────────────────────────────────

export const useCreateAlmacen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlmacenRequest) => almacenesAPI.create(data),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: almacenesKeys.all }); },
  });
};

export const useUpdateAlmacen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAlmacenRequest }) =>
      almacenesAPI.update(id, data),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: almacenesKeys.all }); },
  });
};

export const useDeleteAlmacen = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => almacenesAPI.delete(id),
    onSuccess:  () => { void qc.invalidateQueries({ queryKey: almacenesKeys.all }); },
  });
};
