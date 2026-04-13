export const AUTH_DATASET_VERSION = "kan-89-v1" as const;
export const AUTH_DEFAULT_PASSWORD = "Sisem_123456" as const;

const AUTH_HARNESS_MODE = {
  BACKEND_REAL: "backend-real",
  HYBRID: "hybrid",
} as const;

export type AuthHarnessMode =
  (typeof AUTH_HARNESS_MODE)[keyof typeof AUTH_HARNESS_MODE];

const AUTH_SCENARIO_BEHAVIOR = {
  SUCCESS: "success",
  INVALID: "invalid",
  INACTIVE: "inactive",
  BLOCKED: "blocked",
  ONBOARDING: "onboarding",
} as const;

export type AuthScenarioBehavior =
  (typeof AUTH_SCENARIO_BEHAVIOR)[keyof typeof AUTH_SCENARIO_BEHAVIOR];

export const AUTH_SCENARIO_KEY = {
  ADMIN_SUCCESS: "admin_success",
  INVALID_PASSWORD: "invalid_password",
  INACTIVE_USER: "inactive_user",
  BLOCKED_USER: "blocked_user",
  ONBOARDING_USER: "onboarding_user",
  PASSWORD_RESET_USER: "password_reset_user",
} as const;

export type AuthScenarioKey =
  (typeof AUTH_SCENARIO_KEY)[keyof typeof AUTH_SCENARIO_KEY];

export interface CanonicalAuthDatasetScenario {
  backendRealUsername: string;
  hybridUsername: string;
  email?: string;
  expectedBehavior: AuthScenarioBehavior;
}

export interface CanonicalAuthDataset {
  version: string;
  password: string;
  scenarios: Record<AuthScenarioKey, CanonicalAuthDatasetScenario>;
}

export const AUTH_E2E_CANONICAL_DATASET: CanonicalAuthDataset = {
  version: AUTH_DATASET_VERSION,
  password: AUTH_DEFAULT_PASSWORD,
  scenarios: {
    admin_success: {
      backendRealUsername: "admin",
      hybridUsername: "admin",
      email: "admin@sisem.local",
      expectedBehavior: AUTH_SCENARIO_BEHAVIOR.SUCCESS,
    },
    invalid_password: {
      backendRealUsername: "admin",
      hybridUsername: "admin",
      email: "admin@sisem.local",
      expectedBehavior: AUTH_SCENARIO_BEHAVIOR.INVALID,
    },
    inactive_user: {
      backendRealUsername: "usuario_inactivo_clinico",
      hybridUsername: "inactive",
      email: "inactivo.clinico@sisem.local",
      expectedBehavior: AUTH_SCENARIO_BEHAVIOR.INACTIVE,
    },
    blocked_user: {
      backendRealUsername: "usuario_bloqueado_clinico",
      hybridUsername: "locked",
      email: "bloqueado.clinico@sisem.local",
      expectedBehavior: AUTH_SCENARIO_BEHAVIOR.BLOCKED,
    },
    onboarding_user: {
      backendRealUsername: "usuario_onboarding_clinico",
      hybridUsername: "newuser",
      email: "onboarding.clinico@sisem.local",
      expectedBehavior: AUTH_SCENARIO_BEHAVIOR.ONBOARDING,
    },
    password_reset_user: {
      backendRealUsername: "usuario_cambiar_clave_clinico",
      hybridUsername: "usuario_cambiar_clave_clinico",
      email: "clinico@sisem.local",
      expectedBehavior: AUTH_SCENARIO_BEHAVIOR.SUCCESS,
    },
  },
};

export const AUTH_TEST_EMAILS = {
  admin: "admin@sisem.local",
  clinico: "clinico@sisem.local",
  recepcion: "recepcion@sisem.local",
  farmacia: "farmacia@sisem.local",
  urgencias: "urgencias@sisem.local",
  unknown: "noexiste@sisem.local",
} as const;

const AUTH_TEST_USER_MATRIX = {
  admin: { backendRealUsername: "admin", hybridUsername: "admin" },
  clinico: { backendRealUsername: "clinico", hybridUsername: "clinico" },
  recepcion: {
    backendRealUsername: "recepcion",
    hybridUsername: "recepcion",
  },
  farmacia: { backendRealUsername: "farmacia", hybridUsername: "farmacia" },
  urgencias: {
    backendRealUsername: "urgencias",
    hybridUsername: "urgencias",
  },
  inactivo: {
    backendRealUsername: "usuario_inactivo_clinico",
    hybridUsername: "inactive",
  },
  bloqueado: {
    backendRealUsername: "usuario_bloqueado_clinico",
    hybridUsername: "locked",
  },
  onboarding: {
    backendRealUsername: "usuario_onboarding_clinico",
    hybridUsername: "newuser",
  },
  onboardingClinico: {
    backendRealUsername: "usuario_onboarding_clinico",
    hybridUsername: "newuser",
  },
  onboardingRecepcion: {
    backendRealUsername: "usuario_onboarding_recepcion",
    hybridUsername: "newuser",
  },
  cambiarClave: {
    backendRealUsername: "usuario_cambiar_clave",
    hybridUsername: "usuario_cambiar_clave_clinico",
  },
  cambiarClaveClinico: {
    backendRealUsername: "usuario_cambiar_clave_clinico",
    hybridUsername: "usuario_cambiar_clave_clinico",
  },
} as const;

export type AuthTestUserKey = keyof typeof AUTH_TEST_USER_MATRIX;

const RESET_EMAIL_MATRIX = {
  TC010: {
    chromium: AUTH_TEST_EMAILS.admin,
    firefox: AUTH_TEST_EMAILS.clinico,
    webkit: AUTH_TEST_EMAILS.recepcion,
    chrome: AUTH_TEST_EMAILS.farmacia,
    zen: AUTH_TEST_EMAILS.urgencias,
  },
  TC012: {
    chromium: AUTH_TEST_EMAILS.clinico,
    firefox: AUTH_TEST_EMAILS.recepcion,
    webkit: AUTH_TEST_EMAILS.farmacia,
    chrome: AUTH_TEST_EMAILS.urgencias,
    zen: AUTH_TEST_EMAILS.admin,
  },
  TC013: {
    chromium: AUTH_TEST_EMAILS.recepcion,
    firefox: AUTH_TEST_EMAILS.farmacia,
    webkit: AUTH_TEST_EMAILS.urgencias,
    chrome: AUTH_TEST_EMAILS.admin,
    zen: AUTH_TEST_EMAILS.clinico,
  },
  TC014: {
    chromium: AUTH_TEST_EMAILS.farmacia,
    firefox: AUTH_TEST_EMAILS.urgencias,
    webkit: AUTH_TEST_EMAILS.admin,
    chrome: AUTH_TEST_EMAILS.clinico,
    zen: AUTH_TEST_EMAILS.recepcion,
  },
} as const;

export type ResetTestId = keyof typeof RESET_EMAIL_MATRIX;

const FALLBACK_RESET_EMAIL = AUTH_TEST_EMAILS.admin;

export const getScenarioCredentials = (
  mode: AuthHarnessMode,
  scenario: AuthScenarioKey,
) => {
  const scenarioConfig = AUTH_E2E_CANONICAL_DATASET.scenarios[scenario];
  const username =
    mode === AUTH_HARNESS_MODE.BACKEND_REAL
      ? scenarioConfig.backendRealUsername
      : scenarioConfig.hybridUsername;

  return {
    username,
    password: AUTH_E2E_CANONICAL_DATASET.password,
  };
};

export const getAuthTestUserCredentials = (
  mode: AuthHarnessMode,
  userKey: AuthTestUserKey,
) => {
  const userMapping = AUTH_TEST_USER_MATRIX[userKey];
  return {
    username:
      mode === AUTH_HARNESS_MODE.BACKEND_REAL
        ? userMapping.backendRealUsername
        : userMapping.hybridUsername,
    password: AUTH_E2E_CANONICAL_DATASET.password,
  };
};

export const getAuthE2ETestUsers = (mode: AuthHarnessMode) => ({
  admin: getAuthTestUserCredentials(mode, "admin"),
  clinico: getAuthTestUserCredentials(mode, "clinico"),
  recepcion: getAuthTestUserCredentials(mode, "recepcion"),
  farmacia: getAuthTestUserCredentials(mode, "farmacia"),
  urgencias: getAuthTestUserCredentials(mode, "urgencias"),
  inactivo: getAuthTestUserCredentials(mode, "inactivo"),
  bloqueado: getAuthTestUserCredentials(mode, "bloqueado"),
  onboarding: getAuthTestUserCredentials(mode, "onboarding"),
  onboardingClinico: getAuthTestUserCredentials(mode, "onboardingClinico"),
  onboardingRecepcion: getAuthTestUserCredentials(mode, "onboardingRecepcion"),
  cambiarClave: getAuthTestUserCredentials(mode, "cambiarClave"),
  cambiarClaveClinico: getAuthTestUserCredentials(mode, "cambiarClaveClinico"),
});

export const getResetEmail = (testId: ResetTestId, projectName: string) => {
  const mapping = RESET_EMAIL_MATRIX[testId] as Record<string, string>;
  return mapping[projectName] ?? FALLBACK_RESET_EMAIL;
};
