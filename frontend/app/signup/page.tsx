'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { register: authRegister } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // URL'den referral code'u al
  useEffect(() => {
    const refCode = searchParams.get('ref')
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor')
      return
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }

    setLoading(true)

    try {
      await authRegister(
        formData.email,
        formData.username,
        formData.password,
        formData.referralCode || undefined
      )
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👁️</div>
          <h1 className="text-4xl font-black text-white mb-2 neon-text">
            Faceseek
          </h1>
          <p className="text-slate-400">Hesap oluştur ve 1 ücretsiz kredi kazan!</p>
        </div>

        {/* Form */}
        <div className="glass-dark rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="ornek@email.com"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="kullaniciadi"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Şifre
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Şifre Tekrar
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Referral Code */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Referans Kodu (Opsiyonel)
              </label>
              <input
                type="text"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition uppercase"
                placeholder="ABC12345"
              />
              <p className="text-xs text-slate-500 mt-1">
                Referans kodunuz varsa girin
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Kaydediliyor...
                </span>
              ) : (
                '🎁 Kayıt Ol (1 Ücretsiz Kredi)'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Zaten hesabın var mı?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                Giriş Yap
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-6 text-xs text-slate-500 text-center">
            Kayıt olarak{' '}
            <Link href="/privacy" className="text-indigo-400 hover:underline">
              Gizlilik Politikası
            </Link>{' '}
            ve{' '}
            <Link href="/security" className="text-indigo-400 hover:underline">
              Güvenlik
            </Link>{' '}
            koşullarını kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  )
}
