"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import ClientOnly from "@/components/ClientOnly";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, mounted, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && !loading && user) {
      router.push("/dashboard");
    }
  }, [mounted, loading, user, router]);

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
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Giriş başarısız. Email ve şifrenizi kontrol edin.");
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
            <p className="text-slate-400 text-sm md:text-base">Hesabınıza giriş yapın</p>
          </div>

          {/* Form */}
          <div className="glass-dark rounded-2xl p-6 md:p-8 border border-white/10 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
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

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  <span className="inline-flex items-center gap-2">
                    <span>🔒</span>
                    <span>Şifre</span>
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
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-3 md:py-4 text-base md:text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Giriş yapılıyor...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Giriş Yap</span>
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Hesabınız yok mu?{" "}
                <Link
                  href="/signup"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition inline-flex items-center gap-1"
                >
                  <span>🎁</span>
                  <span>Kayıt Ol (1 Ücretsiz Kredi)</span>
                </Link>
              </p>
            </div>

            {/* Forgot Password */}
            <div className="mt-4 text-center">
              <Link
                href="/forgot-password"
                className="text-xs text-slate-500 hover:text-slate-400 transition"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>
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
              <span>Anında Erişim</span>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
