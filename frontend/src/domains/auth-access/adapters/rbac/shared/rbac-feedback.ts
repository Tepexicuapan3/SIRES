import { ApiError, type ApiErrorDetails } from "@api/utils/errors";

type ApiErrorMap = Record<string, string>;

const formatDetails = (details?: ApiErrorDetails) => {
  if (!details) {
    return "";
  }

  const lines = Object.entries(details)
    .flatMap(([field, messages]) => {
      const normalizedMessages = Array.isArray(messages)
        ? messages
        : [messages];
      return normalizedMessages.map((message) => `${field}: ${message}`);
    })
    .filter(Boolean);

  return lines.length > 0 ? ` ${lines.join(" | ")}` : "";
};

export const resolveApiErrorMessage = (
  error: unknown,
  fallback: string,
  codeMessages: ApiErrorMap,
) => {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  const mappedMessage = codeMessages[error.code];
  const baseMessage = mappedMessage || error.message || fallback;

  return `${baseMessage}${formatDetails(error.details)}`;
};
