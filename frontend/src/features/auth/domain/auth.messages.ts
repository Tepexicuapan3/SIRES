import {
  ERROR_CODES,
  ERROR_MESSAGES,
  type ErrorCode,
} from "@/api/utils/errors";

const pickMessages = (codes: ErrorCode[]) =>
  Object.fromEntries(
    codes.map((code) => [code, ERROR_MESSAGES[code]]),
  ) as Record<ErrorCode, string>;

export const loginErrorMessages: Record<ErrorCode, string> = {
  ...pickMessages([
    ERROR_CODES.INVALID_CREDENTIALS,
    ERROR_CODES.USER_NOT_FOUND,
    ERROR_CODES.USER_INACTIVE,
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    ERROR_CODES.ACCOUNT_LOCKED,
    ERROR_CODES.ACCOUNT_EXPIRED,
    ERROR_CODES.SERVICE_UNAVAILABLE,
    ERROR_CODES.SESSION_EXPIRED,
    ERROR_CODES.TOKEN_EXPIRED,
    ERROR_CODES.TOKEN_INVALID,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
  ]),
};

export const onboardingErrorMessages: Record<ErrorCode, string> = {
  ...pickMessages([
    ERROR_CODES.PASSWORD_TOO_WEAK,
    ERROR_CODES.TERMS_NOT_ACCEPTED,
    ERROR_CODES.ONBOARDING_FAILED,
    ERROR_CODES.SESSION_EXPIRED,
    ERROR_CODES.TOKEN_EXPIRED,
    ERROR_CODES.TOKEN_INVALID,
    ERROR_CODES.USER_NOT_FOUND,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
  ]),
};

export const recoveryErrorMessages: Record<ErrorCode, string> = {
  ...pickMessages([
    ERROR_CODES.CODE_EXPIRED,
    ERROR_CODES.INVALID_CODE,
    ERROR_CODES.PASSWORD_TOO_WEAK,
    ERROR_CODES.USER_NOT_FOUND,
    ERROR_CODES.INTERNAL_SERVER_ERROR,
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.TIMEOUT_ERROR,
  ]),
};

export const getAuthErrorMessage = (
  map: Record<ErrorCode, string>,
  code?: string,
) => {
  if (!code) return undefined;
  if (code in map) return map[code as ErrorCode];
  return undefined;
};
