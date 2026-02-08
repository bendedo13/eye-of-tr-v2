"use client";

import { useSiteConfig } from "@/lib/siteConfig";

export default function MaintenanceGate({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const { config, loading } = useSiteConfig(locale);
  const maintenanceMode = !!config?.["site.maintenance_mode"];

  if (loading || maintenanceMode) {
    return loading ? (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    ) : (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl font-black text-white uppercase tracking-tight mb-4">
          {locale === "tr" ? "Bakım Modu" : "Maintenance Mode"}
        </div>
        <div className="text-zinc-500 text-sm font-medium max-w-xl">
          {locale === "tr"
            ? "Sistem kısa süreli bakım modunda. Lütfen daha sonra tekrar deneyin."
            : "The system is under maintenance. Please try again later."}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
