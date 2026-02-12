"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminFaceIndexRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Locale'ü detect et, varsayılan olarak 'tr' kullan
    const locale = pathname.split('/')[1] || 'tr';
    if (!['tr', 'en'].includes(locale)) {
      router.replace("/tr/admin/face-index");
    } else {
      router.replace(`/${locale}/admin/face-index`);
    }
  }, [router, pathname]);

  return null;
}
