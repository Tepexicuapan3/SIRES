import { VISIT_STATUS } from "@api/types";
import { useVisitQueueByStatus } from "@features/flujo-clinico/queries/useVisitQueueByStatus";

interface UseDoctorQueueOptions {
  enabled?: boolean;
}

export const useDoctorQueue = (options: UseDoctorQueueOptions = {}) => {
  const query = useVisitQueueByStatus(undefined, options);

  if (!query.data) {
    return query;
  }

  return {
    ...query,
    data: {
      ...query.data,
      items: query.data.items.filter(
        (visit) =>
          visit.status === VISIT_STATUS.LISTA_PARA_DOCTOR ||
          visit.status === VISIT_STATUS.EN_CONSULTA,
      ),
    },
  };
};
