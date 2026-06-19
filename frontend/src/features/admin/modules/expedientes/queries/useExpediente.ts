import { useQuery } from '@tanstack/react-query';
import { expedientesAPI } from '@api/resources/expedientes.api';
import { expedientesKeys } from './expedientes.keys';

export const useExpediente = (idEmpleado: string | number) => {
  const id = String(idEmpleado ?? '');
  return useQuery({
    queryKey: expedientesKeys.detail(id),
    queryFn: () => expedientesAPI.buscar(id),
    enabled: id.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });
};