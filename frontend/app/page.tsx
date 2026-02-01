'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import LiveStats from '@/components/LiveStats'
import Navbar from '@/components/Navbar'
import ClientOnly from '@/components/ClientOnly'

export default function Home() {
  const { user, mounted, loading } = useAuth()
  const router = useRouter()

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-radial">
        <Navbar />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
            <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-2000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="neon-text">Profesyonel</span>
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Yüz Tanıma Platformu
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Yapay zeka destekli yüz tanıma teknolojisi ile internetteki milyonlarca fotoğrafı saniyeler içinde tarayın.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <>
                  <button
                    onClick={() => router.push('/search')}
                    className="btn-primary px-8 py-4 text-lg"
                  >
                    🔍 Arama Başlat
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-4 rounded-xl transition-all"
                  >
                    📊 Dashboard
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-primary px-8 py-4 text-lg">
                    🚀 Ücretsiz Başla
                  </Link>
                  <Link
                    href="/login"
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-4 rounded-xl transition-all"
                  >
                    Giriş Yap
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>SSL Güvenli</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>GDPR Uyumlu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>%95+ Başarı Oranı</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>7/24 Destek</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Stats Section */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <LiveStats />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-white mb-4">
                Neden <span className="text-indigo-400">Faceseek</span>?
              </h2>
              <p className="text-slate-400 text-lg">
                Sektörün en gelişmiş yüz tanıma teknolojisi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature Cards */}
              {[
                {
                  icon: '🚀',
                  title: 'Hızlı Sonuçlar',
                  description: 'Saniyeler içinde milyonlarca fotoğrafı tarayın',
                },
                {
                  icon: '🔒',
                  title: 'Güvenli & Gizli',
                  description: 'Verileriniz şifrelenmiş ve güvende',
                },
                {
                  icon: '🌐',
                  title: 'Çoklu Kaynak',
                  description: 'Google, Bing, Yandex ve daha fazlası',
                },
                {
                  icon: '🎯',
                  title: 'Yüksek Doğruluk',
                  description: '%95+ doğruluk oranı ile güvenilir sonuçlar',
                },
                {
                  icon: '💎',
                  title: 'Premium Özellikler',
                  description: 'Gelişmiş filtreleme ve sınırsız arama',
                },
                {
                  icon: '📊',
                  title: 'Detaylı Raporlar',
                  description: 'Kapsamlı analiz ve istatistikler',
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="card-dark group"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 bg-[var(--bg-secondary)]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-white mb-4">
                Nasıl Çalışır?
              </h2>
              <p className="text-slate-400 text-lg">
                3 basit adımda yüz tanıma
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Fotoğraf Yükle',
                  description: 'Aramak istediğiniz kişinin fotoğrafını yükleyin',
                },
                {
                  step: '2',
                  title: 'AI Analiz',
                  description: 'Yapay zeka teknolojimiz fotoğrafı analiz eder',
                },
                {
                  step: '3',
                  title: 'Sonuçlar',
                  description: 'İnternet genelinde eşleşen profilleri görün',
                },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-black text-white mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-400">{item.description}</p>
                  </div>
                  {idx < 2 && (
                    <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-dark rounded-3xl p-12 border border-white/10">
              <h2 className="text-4xl font-black text-white mb-4">
                Hemen Başlayın
              </h2>
              <p className="text-xl text-slate-300 mb-8">
                İlk aramanız ücretsiz! Kayıt olun ve teknolojimizi deneyin.
              </p>
              {!user && (
                <Link href="/register" className="btn-primary px-8 py-4 text-lg inline-block">
                  🎁 1 Ücretsiz Kredi İle Başla
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-slate-800">
          <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
            <p>&copy; 2024 Faceseek. Tüm hakları saklıdır.</p>
            <div className="flex justify-center gap-6 mt-4">
              <Link href="/about" className="hover:text-indigo-400 transition">
                Hakkımızda
              </Link>
              <Link href="/privacy" className="hover:text-indigo-400 transition">
                Gizlilik
              </Link>
              <Link href="/security" className="hover:text-indigo-400 transition">
                Güvenlik
              </Link>
              <Link href="/pricing" className="hover:text-indigo-400 transition">
                Fiyatlandırma
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </ClientOnly>
  )
}
