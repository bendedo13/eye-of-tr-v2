"use client";

import { useEffect, useState } from "react";
import Toast from "./Toast";

/**
 * Toast container - global toast yönetimi
 */
interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const newToast: ToastItem = {
        id: Date.now(),
        message: detail.message,
        type: detail.type,
        duration: detail.duration,
      };
      setToasts((prev) => [...prev, newToast]);
    };

    window.addEventListener("show-toast", handleToast);
    return () => window.removeEventListener("show-toast", handleToast);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
