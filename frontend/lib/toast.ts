/**
 * Toast notification yöneticisi
 * React state yerine event-based yaklaşım
 */

type ToastType = "success" | "error" | "info" | "warning";

interface ToastEvent {
  message: string;
  type: ToastType;
  duration?: number;
}

export const toast = {
  success: (message: string, duration = 3000) => {
    dispatchToast({ message, type: "success", duration });
  },
  error: (message: string, duration = 3000) => {
    dispatchToast({ message, type: "error", duration });
  },
  info: (message: string, duration = 3000) => {
    dispatchToast({ message, type: "info", duration });
  },
  warning: (message: string, duration = 3000) => {
    dispatchToast({ message, type: "warning", duration });
  },
};

function dispatchToast(event: ToastEvent) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: event }));
  }
}
