"use client";

import { useEffect, useState } from "react";

/**
 * SSR/Client hydration uyumlu wrapper
 * Children'ı sadece client'ta render eder
 */
export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
