import { useQuery } from '@tanstack/react-query';
import { expedientesAPI } from '@api/resources/expedientes.api';
import { expedientesKeys } from './expedientes.keys';

export const useExpediente = (idEmpleado: string) =>
  useQuery({
    queryKey: expedientesKeys.detail(idEmpleado),
    queryFn: () => expedientesAPI.buscar(idEmpleado),
    enabled: idEmpleado.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });