"use client";

import { useEffect, useState } from "react";

/**
 * SSR/Client hydration uyumlu wrapper
 * Children'ı sadece client'ta render eder
 */
export default function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
