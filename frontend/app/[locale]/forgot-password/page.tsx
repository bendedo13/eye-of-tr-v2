"use client";

import { use, useState } from "react";
import Link from "next/link";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestPasswordReset(email, locale);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "İstek başarısız.");
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
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">ŞİFRE SIFIRLAMA</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">E-posta adresini gir</p>
          </div>

          <GlassCard className="p-10 border-t-4 border-t-primary/30" hasScanline>
            {sent ? (
              <div className="space-y-6 text-center">
                <div className="text-white font-black uppercase tracking-tight">Eğer hesap varsa mail gönderildi.</div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  Mail kutunu kontrol et. Linkin süresi sınırlıdır.
                </p>
                <Button className="h-14 w-full" onClick={() => (window.location.href = `/${locale}/login`)}>
                  GİRİŞE DÖN <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-8">
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Mail size={12} /> E-POSTA
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50"
                    placeholder="mail@ornek.com"
                    required
                    disabled={busy}
                  />
                </div>

                <Button type="submit" isLoading={busy} className="h-14 w-full">
                  RESET LİNKİ GÖNDER <ArrowRight size={16} className="ml-2" />
                </Button>

                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-center">
                  Giriş ekranına dön:{" "}
                  <Link href={`/${locale}/login`} className="text-primary hover:text-white transition-colors underline underline-offset-4 decoration-primary/40 hover:decoration-primary">
                    OPERASYONEL ERİŞİM
                  </Link>
                </p>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </ClientOnly>
  );
}

