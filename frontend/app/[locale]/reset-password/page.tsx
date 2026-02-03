"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { resetPassword } from "@/lib/api";

export default function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: { email?: string; token?: string };
}) {
  const { locale } = use(params);
  const router = useRouter();
  const email = searchParams.email || "";
  const token = searchParams.token || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !token) {
      setError("Link geçersiz.");
      return;
    }
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email, token, password);
      router.push(`/${locale}/login`);
    } catch (err: any) {
      setError(err.message || "Şifre sıfırlama başarısız.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--color-primary-glow)_0%,_transparent_70%)] relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

        <div className="w-full max-w-[520px] animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-12">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 mb-8 group transition-transform hover:scale-105">
              <div className="w-14 h-14 bg-primary/20 border border-primary/40 rounded-2xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20 group-hover:rotate-6 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <span className="font-black text-3xl tracking-tighter text-white uppercase">
                FACE<span className="text-zinc-600">SEEK</span>
              </span>
            </Link>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">YENİ ŞİFRE</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">{email || "—"}</p>
          </div>

          <GlassCard className="p-10 border-t-4 border-t-primary/30" hasScanline>
            <form onSubmit={submit} className="space-y-8">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                  <KeyRound size={12} /> YENİ ŞİFRE
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50"
                  placeholder="••••••••"
                  disabled={busy}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                  <KeyRound size={12} /> TEKRAR
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50"
                  placeholder="••••••••"
                  disabled={busy}
                  required
                />
              </div>

              <Button type="submit" isLoading={busy} className="h-14 w-full">
                KAYDET <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>
          </GlassCard>
        </div>
      </div>
    </ClientOnly>
  );
}

