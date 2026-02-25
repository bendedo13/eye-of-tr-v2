'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Başlangıç',
      monthlyPrice: 0,
      yearlyPrice: 0,
      credits: 5,
      description: 'Küçük projeler için',
      features: [
        '5 Arama/Ay',
        'Temel Arama',
        'Email Destek',
        '30 Gün Geçmiş',
      ],
      cta: 'Başla',
      popular: false,
    },
    {
      name: 'Profesyonel',
      monthlyPrice: 299,
      monthlyPriceCurrency: 'TL',
      yearlyPrice: 14.99,
      yearlyPriceCurrency: 'USD',
      credits: 100,
      description: 'Aktif kullanıcılar için',
      features: [
        'Sınırsız Arama',
        'AlanSearch + Location',
        'Öncelikli Destek',
        '1 Yıl Geçmiş',
        'Batch İşleme',
      ],
      cta: 'Satın Al',
      popular: true,
    },
    {
      name: 'Kredi Paketi',
      monthlyPrice: 100,
      monthlyPriceCurrency: 'TL',
      yearlyPrice: 2,
      yearlyPriceCurrency: 'USD',
      credits: 50,
      description: 'İsteğe bağlı satın alma',
      features: [
        '50 Arama Kredisi',
        '1 Yıl Geçerlilik',
        'Herhangi Zaman Kullan',
        'İade Yok',
      ],
      cta: 'Kredi Satın Al',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Şeffaf Fiyatlandırma
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            Her bütçe için uygun plan seç
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Aylık
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Yıllık / USD
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl p-8 transition transform hover:scale-105 ${
                plan.popular
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 ring-2 ring-blue-400 shadow-2xl'
                  : 'bg-slate-800 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {plan.popular && (
                <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold w-fit mb-4">
                  POPULER
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-slate-100'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mb-6 ${plan.popular ? 'text-blue-100' : 'text-slate-400'}`}>
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                {billingCycle === 'monthly' ? (
                  <div className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-100'}`}>
                    {plan.monthlyPrice === 0 ? (
                      'Ücretsiz'
                    ) : (
                      <>
                        {plan.monthlyPrice}
                        <span className="text-lg ml-1">{plan.monthlyPriceCurrency || 'TL'}</span>
                      </>
                    )}
                    <span className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-slate-400'}`}>
                      {plan.monthlyPrice !== 0 && '/ay'}
                    </span>
                  </div>
                ) : (
                  <div className={`text-4xl font-bold ${plan.popular ? 'text-white' : 'text-slate-100'}`}>
                    ${plan.yearlyPrice}
                    <span className={`text-sm ${plan.popular ? 'text-blue-100' : 'text-slate-400'}`}>
                      /yıl
                    </span>
                  </div>
                )}
                {plan.credits > 0 && (
                  <p className={`text-sm mt-2 ${plan.popular ? 'text-blue-100' : 'text-slate-400'}`}>
                    {plan.credits} Arama Kredisi
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Link href={`/auth/register?plan=${plan.name.toLowerCase().replace(' ', '-')}`}>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition mb-8 ${
                    plan.popular
                      ? 'bg-white text-blue-600 hover:bg-slate-100'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </Link>

              {/* Features */}
              <ul className="space-y-4">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-3">
                    <Check
                      size={20}
                      className={plan.popular ? 'text-white' : 'text-blue-400'}
                    />
                    <span className={plan.popular ? 'text-white' : 'text-slate-300'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">Sık Sorulan Sorular</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Kredi paketini nasıl kullanırım?
              </h3>
              <p className="text-slate-400">
                Kredi satın aldıktan sonra hesabınıza yüklenir. Her aramada bir kredi kullanılır. 1 yıl içinde kullanmayan krediler sona erer.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Plan değiştirebilir miyim?
              </h3>
              <p className="text-slate-400">
                Evet, istediğiniz zaman yükseltebilir veya indirebilirsiniz. Ödeme oranlanacaktır.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                İptal etmek istersen?
              </h3>
              <p className="text-slate-400">
                Hesap ayarlarından istediğiniz zaman iptal edebilirsiniz. Kalan dönem ödemeniz iade edilir.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">
                Kurumsal çözüm var mı?
              </h3>
              <p className="text-slate-400">
                Evet, <Link href="/contact" className="text-blue-400 hover:text-blue-300">iletişime geçin</Link> ve özel fiyatlandırmayı öğrenin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}