import { ApiError } from "@api/utils/errors";

type ApiErrorMap = Record<string, string>;

const formatDetails = (details?: Record<string, string[]>) => {
  if (!details) {
    return "";
  }

  const lines = Object.entries(details)
    .flatMap(([field, messages]) =>
      messages.map((message) => `${field}: ${message}`),
    )
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
