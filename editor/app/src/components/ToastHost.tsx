import React from "react";

import { Prefs } from "@serendipity/editor-stores";

type ToastLevel = "info" | "success" | "error";

interface Toast {
  id: number;
  level: ToastLevel;
  message: string;
}

export function ToastHost() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    let id = 0;
    const onToast = (evt: CustomEvent<{ level: ToastLevel; message: string }>) => {
      const toast = { id: ++id, ...evt.detail };
      setToasts((existing) => [...existing, toast]);
      window.setTimeout(() => {
        setToasts((existing) => existing.filter((item) => item.id !== toast.id));
      }, 3200);
    };

    Prefs.eventBus.addEventListener("toast", onToast);
    return () => Prefs.eventBus.removeEventListener("toast", onToast);
  }, []);

  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.level}`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}

export default ToastHost;
