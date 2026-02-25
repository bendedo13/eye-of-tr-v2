
import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Pricing() {
  const router = useRouter();
  const [currency, setCurrency] = React.useState<'TRY' | 'USD'>('TRY');

  const plans = [
    {
      name: 'Ücretsiz',
      description: 'Başlangıç için ideal',
      price: { TRY: '0', USD: '0' },
      currency: currency,
      features: [
        '5 arama/gün',
        'Temel AlanSearch',
        'Standart sonuçlar',
      ],
      cta: 'Başla',
      highlighted: false,
    },
    {
      name: 'Premium',
      description: 'Profesyonel kullanım',
      price: { TRY: '299', USD: '14.99' },
      currency: currency,
      features: [
        'Sınırsız arama',
        'Gelişmiş filtreleme',
        'Hızlı sonuçlar (2sn)',
        'Öncelikli destek',
        'Arama geçmişi',
      ],
      cta: 'Şimdi Satın Al',
      highlighted: true,
    },
    {
      name: 'Kredi Paketi',
      description: 'Esnek kullanım',
      price: { TRY: '100', USD: '2' },
      currency: currency,
      features: [
        '100 arama kredisi',
        '6 ay geçerlilik',
        'İstediğin zaman kullan',
        'Paket kombinasyonu',
        'Otomatik yenileme seçeneği',
      ],
      cta: 'Kredi Satın Al',
      highlighted: false,
    },
  ];

  const handlePurchase = (planName: string) => {
    router.push(`/checkout?plan=${planName}&currency=${currency}`);
  };

  return (
    <>
      <Head>
        <title>Fiyatlandırma - FaceSeek</title>
        <meta name="description" content="FaceSeek fiyatlandırma planları" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Şeffaf Fiyatlandırma
            </h1>
            <p className="text-xl text-slate-300 mb-8">
              Her bütçeye uygun plan seç
            </p>

            {/* Currency Toggle */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setCurrency('TRY')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  currency === 'TRY'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                ₺ Türk Lirası
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  currency === 'USD'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                $ USD
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 transition transform hover:scale-105 ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-blue-600 to-blue-700 shadow-2xl ring-2 ring-blue-400 md:scale-105'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-yellow-400 text-slate-900 text-sm font-bold py-1 px-3 rounded-full inline-block mb-4">
                    POPÜLER
                  </div>
                )}

                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-slate-200 text-sm mb-6">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    {plan.price[currency]}
                  </span>
                  {plan.price[currency] !== '0' && (
                    <span className="text-slate-300 ml-2">
                      {currency === 'TRY' ? '₺/ay' : '$'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handlePurchase(plan.name)}
                  className={`w-full py-3 rounded-lg font-semibold mb-8 transition ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-slate-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start text-slate-100">
                      <span className="mr-3">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="bg-slate-700 rounded-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">
              Sıkça Sorulan Sorular
            </h2>
            <div className="space-y-4">
              <details className="text-slate-100 cursor-pointer">
                <summary className="font-semibold mb-2">
                  Planları herhangi zaman değiştirebilir miyim?
                </summary>
                <p className="text-slate-300 ml-4">
                  Evet, istediğin zaman upgrade veya downgrade yapabilirsin.
                </p>
              </details>

              <details className="text-slate-100 cursor-pointer">
                <summary className="font-semibold mb-2">
                  İade politikası nedir?
                </summary>
                <p className="text-slate-300 ml-4">
                  İlk 7 gün içinde para iade edilir, sorumluluk yok.
                </p>
              </details>

              <details className="text-slate-100 cursor-pointer">
                <summary className="font-semibold mb-2">
                  Kredi paketinin süresi ne kadar?
                </summary>
                <p className="text-slate-300 ml-4">
                  Kredi paketleri 6 ay boyunca geçerlidir. Kullanılmayan krediler
                  sonra silinir.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
