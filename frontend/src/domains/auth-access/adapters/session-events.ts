export const SESSION_EXPIRED_EVENT = "sisem:session-expired";
const SESSION_EXPIRED_STORAGE_KEY = "sisem:session-expired";
const SESSION_EXPIRED_CHANNEL = "sisem:session-expired";

export const emitSessionExpired = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));

  try {
    window.localStorage.setItem(
      SESSION_EXPIRED_STORAGE_KEY,
      Date.now().toString(),
    );
    window.localStorage.removeItem(SESSION_EXPIRED_STORAGE_KEY);
  } catch {
    // localStorage puede estar bloqueado en algunos entornos.
  }

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(SESSION_EXPIRED_CHANNEL);
    channel.postMessage({ type: SESSION_EXPIRED_EVENT });
    channel.close();
  }
};

export const subscribeSessionExpired = (handler: () => void) => {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SESSION_EXPIRED_STORAGE_KEY) {
      handler();
    }
  };

  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  window.addEventListener("storage", handleStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(SESSION_EXPIRED_CHANNEL);
    channel.addEventListener("message", (event) => {
      if (event.data?.type === SESSION_EXPIRED_EVENT) {
        handler();
      }
    });
  }

  return () => {
    window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      channel.close();
    }
  };
};
