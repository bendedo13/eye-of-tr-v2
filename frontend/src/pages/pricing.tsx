import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const PricingPage = () => {
  const [currency, setCurrency] = useState<'TRY' | 'USD'>('TRY');

  const plans = [
    {
      name: 'Ücretsiz',
      monthlyTRY: 0,
      monthlyUSD: 0,
      credits: 5,
      features: [
        '5 arama kredisi',
        'Temel yüz tanıma',
        'Google Dork arama',
        'Standart destek',
      ],
      notIncluded: [
        'Konum bazlı arama',
        'Gelişmiş filtreler',
        'CSV dışa aktarma',
        'Öncelikli destek',
      ],
      cta: 'Ücretsiz Başla',
      href: '/register',
      highlight: false,
      badge: null,
    },
    {
      name: 'Aylık Plan',
      monthlyTRY: 299,
      monthlyUSD: 14.99,
      credits: 500,
      features: [
        '500 arama kredisi/ay',
        'Gelişmiş yüz tanıma',
        'Google Dork arama',
        'Konum bazlı arama',
        'Gelişmiş filtreler',
        'CSV dışa aktarma',
        'Öncelikli destek',
      ],
      notIncluded: [],
      cta: 'Hemen Başla',
      href: '/register?plan=monthly',
      highlight: true,
      badge: 'En Popüler',
    },
    {
      name: 'Kredi Paketi',
      monthlyTRY: 100,
      monthlyUSD: 2,
      credits: 50,
      features: [
        '50 arama kredisi',
        'Gelişmiş yüz tanıma',
        'Google Dork arama',
        'Konum bazlı arama',
        'Gelişmiş filtreler',
        'CSV dışa aktarma',
        'Standart destek',
      ],
      notIncluded: [],
      cta: 'Kredi Satın Al',
      href: '/register?plan=credits',
      highlight: false,
      badge: 'Esnek',
    },
  ];

  return (
    <>
      <Head>
        <title>Fiyatlandırma | FaceSeek</title>
        <meta name="description" content="FaceSeek fiyatlandırma planları" />
      </Head>

      <div className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold">FaceSeek</span>
              </Link>
              <nav className="flex items-center space-x-6">
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Dashboard
                </Link>
                <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Giriş Yap
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-20 pb-12 text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Basit ve{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Şeffaf
            </span>{' '}
            Fiyatlandırma
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            İhtiyacınıza göre plan seçin. Aylık abonelik veya esnek kredi paketi ile başlayın.
          </p>

          {/* Currency Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-xl p-1 border border-gray-700">
            <button
              onClick={() => setCurrency('TRY')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                currency === 'TRY'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ₺ TRY
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                currency === 'USD'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              $ USD
            </button>
          </div>
        </section>

        {/* Plans */}
        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-blue-500 bg-blue-950/30 shadow-2xl shadow-blue-500/20'
                    : 'border-gray-700 bg-gray-900/50'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                      plan.highlight
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-extrabold">
                      {currency === 'TRY'
                        ? plan.monthlyTRY === 0
                          ? 'Ücretsiz'
                          : `₺${plan.monthlyTRY}`
                        : plan.monthlyUSD === 0
                        ? 'Free'
                        : `$${plan.monthlyUSD}`}
                    </span>
                    {plan.monthlyTRY > 0 && (
                      <span className="text-gray-400 text-sm mb-1">
                        {plan.name === 'Aylık Plan' ? '/ay' : '/paket'}
                      </span>
                    )}
                  </div>
                  {plan.monthlyTRY > 0 && (
                    <p className="text-gray-500 text-sm">
                      {currency === 'TRY'
                        ? `≈ $${plan.monthlyUSD} USD`
                        : `≈ ₺${plan.monthlyTRY} TRY`}
                    </p>
                  )}
                  <p className="text-blue-400 text-sm font-medium mt-2">
                    {plan.credits} arama kredisi
                    {plan.name === 'Aylık Plan' ? ' / ay' : ''}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <svg className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ / Notes */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-8">Sık Sorulan Sorular</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
              {[
                {
                  q: 'Kredi ne zaman düşer?',
                  a: 'Her başarılı arama sonucunda 1 kredi düşer. Başarısız aramalar kredi tüketmez.',
                },
                {
                  q: 'Aylık plan kredileri devreder mi?',
                  a: 'Hayır, aylık 500 kredi her ay sıfırlanır. Kullanılmayan krediler devretmez.',
                },
                {
                  q: 'Ödeme yöntemleri neler?',
                  a: 'Kredi kartı, banka kartı ve havale/EFT ile ödeme kabul edilmektedir.',
                },
                {
                  q: 'İptal etmek istediğimde ne olur?',
                  a: 'Aylık planı istediğiniz zaman iptal edebilirsiniz. Dönem sonuna kadar hizmet devam eder.',
                },
              ].map((item) => (
                <div key={item.q} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h4 className="font-semibold mb-2 text-white">{item.q}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 text-center bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border border-blue-800/50 rounded-2xl p-10">
            <h3 className="text-2xl font-bold mb-3">Hâlâ emin değil misiniz?</h3>
            <p className="text-gray-400 mb-6">
              5 ücretsiz kredi ile hemen deneyin. Kredi kartı gerekmez.
            </p>
            <Link
              href="/register"
              className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
          <p>© 2024 FaceSeek. Tüm hakları saklıdır.</p>
        </footer>
      </div>
    </>
  );
};

export default PricingPage;