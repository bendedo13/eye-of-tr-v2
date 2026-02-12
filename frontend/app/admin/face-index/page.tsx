"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminFaceIndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tr/admin/face-index");
  }, [router]);

  return null;
}
