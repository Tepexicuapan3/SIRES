/**
 * Factory de query keys para catalogos simples con forma {id, name, isActive}.
 *
 * Los ~11 catalogos administrativos (sucursales, especialidades, turnos,
 * vacunas, etc.) repetian el mismo archivo *.keys.ts palabra por palabra,
 * solo cambiando el BASE_KEY. Este factory reemplaza esa duplicacion
 * mecanica -- los catalogos con logica propia (paginas genericas via
 * useCatalogList, o casos con enabled/params no estandar como
 * centro-area-clinica) NO pasan por aca a proposito.
 */
export function createCatalogKeys<TParams>(baseKey: readonly string[]) {
  return {
    all: baseKey,
    list: (params?: TParams) =>
      params
        ? ([...baseKey, "list", params] as const)
        : ([...baseKey, "list"] as const),
    detail: (id: number) => [...baseKey, "detail", id] as const,
  };
}
