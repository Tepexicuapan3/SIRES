import { ApiError } from "@api/utils/errors";

const formatDetails = (details?: Record<string, string[]>) => {
  if (!details) return "";

  const lines = Object.entries(details)
    .flatMap(([field, messages]) =>
      messages.map((message) => `${field}: ${message}`),
    )
    .filter(Boolean);

  if (lines.length === 0) return "";
  return ` ${lines.join(" | ")}`;
};

export const getCatalogErrorMessage = (
  error: unknown,
  fallback: string,
  messages: Record<string, string>,
) => {
  if (error instanceof ApiError) {
    const mappedMessage = messages[error.code];
    const baseMessage = mappedMessage || error.message || fallback;
    return `${baseMessage}${formatDetails(error.details)}`;
  }

  return fallback;
};
