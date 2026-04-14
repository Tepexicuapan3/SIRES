import { ApiError, type ApiErrorDetails } from "@api/utils/errors";

const formatDetails = (details?: ApiErrorDetails) => {
  if (!details) return "";

  const lines = Object.entries(details)
    .flatMap(([field, messages]) => {
      const normalizedMessages = Array.isArray(messages)
        ? messages
        : [messages];
      return normalizedMessages.map((message) => `${field}: ${message}`);
    })
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
