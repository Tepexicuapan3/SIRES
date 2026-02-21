/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_USE_MSW: string;
  readonly VITE_BACKEND_PORT?: string;
  readonly VITE_VISITS_STREAM_URL?: string;
  readonly VITE_VISITS_STREAM_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
