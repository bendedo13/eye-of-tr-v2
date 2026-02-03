"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Mail, Key, ShieldCheck, Zap, ArrowRight, Layout } from "lucide-react";

import { use } from "react";

export default function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const { login, user, mounted, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [mounted, loading, user, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Lütfen tüm alanları doldurun");
      return;
    }

    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setError(err.message || "Giriş başarısız. Kimlik bilgilerinizi kontrol edin.");
    } finally {
      setIsLoading(false);
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
        {/* Background Decoration */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

        <div className="w-full max-w-[480px] animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-3 mb-8 group transition-transform hover:scale-105">
              <div className="w-14 h-14 bg-primary/20 border border-primary/40 rounded-2xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20 group-hover:rotate-6 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <span className="font-black text-3xl tracking-tighter text-white uppercase">FACE<span className="text-zinc-600">SEEK</span></span>
            </Link>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">OPERASYONEL ERİŞİM</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Layout size={12} /> Secure Portal Entry Protocol
            </p>
          </div>

          <GlassCard className="p-10 border-t-4 border-t-primary/30" hasScanline>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Mail size={12} /> E-POSTA ADRESİ
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50"
                    placeholder="analyst@faceseek.io"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                      <Key size={12} /> PAROLA
                    </label>
                    <Link href={`/${locale}/forgot-password`} className="text-[9px] font-black text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">ŞİFREMİ UNUTTUM</Link>
                  </div>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-16 font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20"
              >
                SİSTEME GİRİŞ YAP <ArrowRight className="ml-3" size={18} />
              </Button>
            </form>
          </GlassCard>

          <p className="mt-10 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Hesabınız yok mu? <Link href={`/${locale}/register`} className="text-primary hover:text-white transition-colors underline underline-offset-4 decoration-primary/40 hover:decoration-primary">OPERASYONA KATILIN</Link>
          </p>

          <div className="mt-12 flex justify-center items-center gap-8 grayscale opacity-30">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-600">
              <ShieldCheck size={14} /> 256-BIT AES
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-600">
              <Zap size={14} /> INSTANT SYNC
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
