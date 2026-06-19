import { useQuery } from '@tanstack/react-query';
import { expedientesAPI } from '@api/resources/expedientes.api';
import { expedientesKeys } from './expedientes.keys';

export const useBuscarPorNombre = (nombre: string) =>
  useQuery({
    queryKey: expedientesKeys.byName(nombre),
    queryFn: () => expedientesAPI.buscarPorNombre(nombre),
    enabled: nombre.trim().length >= 3,
    staleTime: 1000 * 60 * 2,
  });
