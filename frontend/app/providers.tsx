"use client";

import { AuthProvider } from "@/context/AuthContext";
import AnalyticsHeartbeat from "@/components/AnalyticsHeartbeat";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AnalyticsHeartbeat />
      {children}
    </AuthProvider>
  );
}
