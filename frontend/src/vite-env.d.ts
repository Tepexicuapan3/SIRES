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
  readonly VITE_VISITS_STREAM_HEARTBEAT_INTERVAL_MS?: string;
  readonly VITE_VISITS_STREAM_HEARTBEAT_TIMEOUT_MS?: string;
  readonly VITE_VISITS_STREAM_BACKOFF_BASE_MS?: string;
  readonly VITE_VISITS_STREAM_BACKOFF_MAX_MS?: string;
  readonly VITE_VISITS_STREAM_JITTER_RATIO?: string;
  readonly VITE_VISITS_STREAM_DISCONNECT_GRACE_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
