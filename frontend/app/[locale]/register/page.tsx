"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ClientOnly from "@/components/ClientOnly";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { UserPlus, Mail, Key, ShieldCheck, Zap, ArrowRight, Layout, User } from "lucide-react";

import { use } from "react";

export default function RegisterPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const router = useRouter();
  const { register, user, mounted, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mounted && !loading && user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [mounted, loading, user, router, locale]);

  // Handle referral code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referralCode: ref }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.username || !formData.email || !formData.password) {
      setError("Lütfen gerekli alanları doldurun");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    setIsLoading(true);

    try {
      const res = await register(formData.email, formData.username, formData.password, formData.referralCode);
      if (res.needsVerification) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("pending-verify-email", formData.email);
        }
        const qp = new URLSearchParams({ email: res.email });
        if (res.debugCode) qp.set("debug_code", res.debugCode);
        router.push(`/${locale}/verify-email?${qp.toString()}`);
      } else {
        router.push(`/${locale}/dashboard?welcome=true`);
      }
    } catch (err: any) {
      // Provide more specific error messages
      if (err.statusCode === 400) {
        if (err.message?.toLowerCase().includes("email")) {
          setError("Bu e-posta adresi zaten kayıtlı.");
        } else if (err.message?.toLowerCase().includes("username")) {
          setError("Bu kullanıcı adı zaten alınmış.");
        } else {
          setError(err.message || "Kayıt bilgileri geçersiz.");
        }
      } else if (err.statusCode === 429) {
        setError("Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin.");
      } else if (err.statusCode === 408 || err.message?.includes("Timeout")) {
        setError("Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.");
      } else if (err.statusCode >= 500) {
        setError("Sunucu hatası. Lütfen daha sonra tekrar deneyin.");
      } else {
        setError(err.message || "Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.");
      }
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-6 bg-[radial-gradient(circle_at_center,_var(--color-primary-glow)_0%,_transparent_70%)] relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

        <div className="w-full max-w-[550px] animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-3 mb-8 group transition-transform hover:scale-105">
              <div className="w-14 h-14 bg-primary/20 border border-primary/40 rounded-2xl flex items-center justify-center text-primary shadow-2xl shadow-primary/20 group-hover:rotate-6 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <span className="font-black text-3xl tracking-tighter text-white uppercase">FACE<span className="text-zinc-600">SEEK</span></span>
            </Link>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">OPERASYONEL KAYIT</h1>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
              <Layout size={12} /> New Analyst Enlistment Protocol
            </p>
          </div>

          <GlassCard className="p-10 border-t-4 border-t-primary/30" hasScanline>
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-500">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                    <User size={12} /> ANALİST ADI
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50"
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Mail size={12} /> E-POSTA
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
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Key size={12} /> PAROLA
                  </label>
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Key size={12} /> DOĞRULA
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                    <Zap size={12} /> DAVET KODU (OPSİYONEL)
                  </label>
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                    className="input-field w-full h-14 bg-black/40 border-zinc-900 focus:border-primary/50 font-mono tracking-widest p-6"
                    placeholder="LOD-X92-2024"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="text-primary flex-shrink-0 mt-1" size={18} />
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                  Kayıt olarak <Link href={`/${locale}/legal/terms`} className="text-white hover:underline">Hizmet Şartlarını</Link> ve <Link href={`/${locale}/legal/privacy`} className="text-white hover:underline">Gizlilik Politikasını</Link> kabul etmiş sayılırsınız. Tüm verileriniz operasyonel gizlilik kuralları çerçevesinde saklanır.
                </p>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full h-16 font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20"
              >
                HESABI OLUŞTUR <ArrowRight className="ml-3" size={18} />
              </Button>
            </form>
          </GlassCard>

          <p className="mt-10 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Zaten bir hesabınız var mı? <Link href={`/${locale}/login`} className="text-primary hover:text-white transition-colors underline underline-offset-4 decoration-primary/40 hover:decoration-primary">OTURUM AÇIN</Link>
          </p>

          {/* Professional Developer Credit */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs">
              © 2017-2026 Face Seek. All Rights Reserved.
            </p>
            <p className="text-slate-600 text-xs mt-2">
              Developed by <span className="text-[#00d9ff] font-semibold">ALAN</span>
            </p>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
