"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ClientOnly from "@/components/ClientOnly";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register: authRegister, user, mounted, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Get referral code from URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setFormData((prev) => ({ ...prev, referralCode: refCode }));
    }
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && !loading && user) {
      router.push("/dashboard");
    }
  }, [mounted, loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.email || !formData.username || !formData.password) {
      setError("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return;
    }

    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }

    if (formData.username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı");
      return;
    }

    setIsLoading(true);

    try {
      await authRegister(
        formData.email,
        formData.username,
        formData.password,
        formData.referralCode || undefined
      );
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || "Kayıt başarısız. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="text-6xl mb-4 animate-pulse-glow">👁️</div>
            </Link>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 neon-text">
              Faceseek
            </h1>
            <p className="text-slate-400 text-sm md:text-base">
              Hesap oluştur ve <span className="text-green-400 font-semibold">1 ücretsiz kredi</span> kazan!
            </p>
          </div>

          {/* Form */}
          <div className="glass-dark rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>📧</span>
                    <span>Email</span>
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  placeholder="ornek@email.com"
                  disabled={isLoading}
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>👤</span>
                    <span>Kullanıcı Adı</span>
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  placeholder="kullaniciadi"
                  disabled={isLoading}
                  minLength={3}
                />
                <p className="text-xs text-slate-500 mt-1">En az 3 karakter</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>🔒</span>
                    <span>Şifre</span>
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  placeholder="••••••••"
                  disabled={isLoading}
                  minLength={6}
                />
                <p className="text-xs text-slate-500 mt-1">En az 6 karakter</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>🔑</span>
                    <span>Şifre Tekrar</span>
                    <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>🎁</span>
                    <span>Referans Kodu</span>
                    <span className="text-xs text-slate-500">(Opsiyonel)</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition uppercase"
                  placeholder="ABC12345"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Referans kodu ile kayıt olun (3 referans = 1 kredi)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 md:py-4 text-base md:text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <span>🎁</span>
                    <span>Kayıt Ol (1 Ücretsiz Kredi)</span>
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Zaten hesabınız var mı?{" "}
                <Link
                  href="/login"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition inline-flex items-center gap-1"
                >
                  <span>🔐</span>
                  <span>Giriş Yap</span>
                </Link>
              </p>
            </div>

            {/* Terms */}
            <p className="mt-6 text-xs text-slate-500 text-center">
              Kayıt olarak{" "}
              <Link href="/privacy" className="text-indigo-400 hover:underline">
                Gizlilik Politikası
              </Link>{" "}
              ve{" "}
              <Link href="/security" className="text-indigo-400 hover:underline">
                Güvenlik
              </Link>{" "}
              koşullarını kabul etmiş olursunuz.
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span>🔒</span>
              <span>SSL Güvenli</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🛡️</span>
              <span>GDPR Uyumlu</span>
            </div>
            <div className="flex items-center gap-1">
              <span>✨</span>
              <span>1 Ücretsiz Kredi</span>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
