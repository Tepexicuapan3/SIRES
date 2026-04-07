import { useQuery } from "@tanstack/react-query";
import { authAPI } from "@api/resources/auth.api";
import { authKeys } from "@/domains/auth-access/state/auth.keys";
import { ApiError } from "@api/utils/errors";
import type { AuthCapabilitiesResponse } from "@api/types";

interface UseAuthCapabilitiesOptions {
  enabled?: boolean;
}

const EMPTY_CAPABILITIES: AuthCapabilitiesResponse["capabilities"] = {};

const isTransientServerError = (error: ApiError): boolean => {
  return error.status >= 500 && error.status < 600;
};

export const useAuthCapabilities = (
  options: UseAuthCapabilitiesOptions = {},
) => {
  const query = useQuery<AuthCapabilitiesResponse, ApiError>({
    queryKey: authKeys.capabilities(),
    queryFn: () => authAPI.getCapabilities(),
    enabled: options.enabled ?? true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: (failureCount, error) => {
      return failureCount < 2 && isTransientServerError(error);
    },
    retryDelay: 0,
  });

  const capabilities = query.data?.capabilities ?? EMPTY_CAPABILITIES;

  const hasCapability = (capabilityKey: string): boolean => {
    return Boolean(capabilities[capabilityKey]?.granted);
  };

  return {
    ...query,
    capabilities,
    hasCapability,
  };
};
