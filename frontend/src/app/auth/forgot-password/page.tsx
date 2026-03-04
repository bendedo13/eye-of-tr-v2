'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2, Check, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form validasyonu
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('E-posta adresi gereklidir');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Geçerli bir e-posta adresi girin');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'İstek başarısız oldu. Lütfen tekrar deneyin.');
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Şifremi Unuttum</h1>
          <p className="text-slate-400">Şifrenizi sıfırlamak için e-posta adresinizi girin</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
          {success ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-green-900/30 border border-green-700/50 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-lg font-semibold text-white">E-posta Gönderildi</h2>
                <p className="text-slate-400 text-sm">
                  Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-center"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Hata Mesajı */}
              {error && (
                <div className="flex gap-3 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {/* E-posta Alanı */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                  E-posta Adresi
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Gönder Butonu */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  'Şifre Sıfırlama Bağlantısı Gönder'
                )}
              </button>
            </form>
          )}

          {/* Geri Dön Linki */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Giriş Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}