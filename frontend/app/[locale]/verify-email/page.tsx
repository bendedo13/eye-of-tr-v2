"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, KeyRound, Mail, ArrowRight, RefreshCcw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { use } from "react";

export default function VerifyEmailPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: { email?: string; debug_code?: string };
}) {
  const { locale } = use(params);
  const router = useRouter();
  const { user, mounted, loading, verifyEmail, resendCode } = useAuth();

  const email = searchParams.email || "";
  const [code, setCode] = useState((searchParams.debug_code || "").replace(/\D/g, "").slice(0, 6));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [mounted, loading, user, router, locale]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Email parametresi eksik.");
      return;
    }
    if (!/^[0-9]{6}$/.test(code)) {
      setError("Doğrulama kodu 6 haneli olmalı.");
      return;
    }
    setBusy(true);
    try {
      await verifyEmail(email, code);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || "Doğrulama başarısız.");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError("");
    if (!email) {
      setError("Email parametresi eksik.");
      return;
    }
    setResending(true);
    try {
      const dbg = await resendCode(email);
      if (dbg) setCode(dbg);
    } catch (err: any) {
      setError(err.message || "Kod tekrar gönderilemedi.");
    } finally {
      setResending(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) return null;

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
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">E-POSTA DOĞRULAMA</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Mail size={12} /> {email || "—"}
            </p>
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
                  <KeyRound size={12} /> 6 HANELİ KOD
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50 font-mono tracking-[0.35em] text-center"
                  placeholder="123456"
                  disabled={busy}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button type="button" variant="outline" className="h-14 flex-1" disabled={resending || busy} onClick={resend}>
                  <RefreshCcw size={16} className="mr-2" /> KODU TEKRAR GÖNDER
                </Button>
                <Button type="submit" isLoading={busy} className="h-14 flex-1">
                  DOĞRULA <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>

              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-center">
                Giriş ekranına dön:{" "}
                <Link href={`/${locale}/login`} className="text-primary hover:text-white transition-colors underline underline-offset-4 decoration-primary/40 hover:decoration-primary">
                  OPERASYONEL ERİŞİM
                </Link>
              </p>
            </form>
          </GlassCard>
        </div>
      </div>
    </ClientOnly>
  );
}
