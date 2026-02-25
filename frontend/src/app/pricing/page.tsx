
'use client';

import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface PricingPlan {
  name: string;
  price_try: number;
  price_usd: number;
  features: string[];
  popular?: boolean;
}

const PLANS: Record<string, PricingPlan> = {
  free: {
    name: 'Ücretsiz',
    price_try: 0,
    price_usd: 0,
    features: [
      'Günde 5 arama',
      'Temel AlanSearch',
      'Arama geçmişi',
    ]
  },
  monthly: {
    name: 'Aylık',
    price_try: 299,
    price_usd: 14.99,
    features: [
      'Aylık 500 arama',
      'Gelişmiş AlanSearch',
      'Konum araması',
      'Arama geçmişi',
      'CSV export',
      'Öncelikli destek',
    ],
    popular: true
  },
  credits: {
    name: 'Kredi Paketi',
    price_try: 100,
    price_usd: 2,
    features: [
      '100 arama kredisi',
      'Süresi sınırsız',
      'İstediğin zaman kullan',
      'AlanSearch + Konum araması',
    ]
  },
  professional: {
    name: 'Profesyonel',
    price_try: 999,
    price_usd: 49.99,
    features: [
      'Aylık 2000 arama',
      'Tüm özellikler',
      'API erişimi',
      'Toplu arama',
      'Dedike destek',
    ]
  }
};

export default function PricingPage() {
  const [currency, setCurrency] = useState<'try' | 'usd'>('try');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Basit ve Şeffaf Fiyatlandırma
          </h1>
          <p className="text-gray-400 text-lg">
            İhtiyacına uygun paketi seç
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrency('try')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              currency === 'try'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            ₺ Türk Lirası
          </button>
          <button
            onClick={() => setCurrency('usd')}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              currency === 'usd'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            $ USD
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div
              key={key}
              className={`relative p-6 rounded-xl border transition ${
                plan.popular
                  ? 'border-blue-500 bg-slate-800/50 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Popüler
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {/* Plan Name */}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>

                {/* Price */}
                <div className="space-y-1">
                  {plan.price_try === 0 && plan.price_usd === 0 ? (
                    <div className="text-3xl font-bold text-blue-400">Ücretsiz</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-white">
                        {currency === 'try' ? '₺' : '$'}
                        {currency === 'try' ? plan.price_try : plan.price_usd}
                      </div>
                      {key === 'monthly' && (
                        <p className="text-sm text-gray-400">/ay</p>
                      )}
                      {key === 'credits' && (
                        <p className="text-sm text-gray-400">bir defalık</p>
                      )}
                    </>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 py-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex gap-3">
                      <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className={`w-full font-semibold transition ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {plan.price_try === 0 && plan.price_usd === 0 ? 'Başla' : 'Satın Al'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">Sık Sorulan Sorular</h2>
          
          <div className="space-y-4">
            <details className="group p-4 bg-slate-800/30 rounded-lg border border-slate-700 cursor-pointer">
              <summary className="flex justify-between items-center text-white font-medium">
                Kredi paketi ne kadar süre geçerli?
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-gray-400 text-sm">
                Kredi paketleri süresi sınırsızdır. Satın aldığınız kredileri istediğiniz zaman kullanabilirsiniz.
              </p>
            </details>

            <details className="group p-4 bg-slate-800/30 rounded-lg border border-slate-700 cursor-pointer">
              <summary className="flex justify-between items-center text-white font-medium">
                Aylık paket otomatik yenilenir mi?
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-gray-400 text-sm">
                Evet, aylık paket her ay otomatik yenilenir. İstediğiniz zaman iptal edebilirsiniz.
              </p>
            </details>

            <details className="group p-4 bg-slate-800/30 rounded-lg border border-slate-700 cursor-pointer">
              <summary className="flex justify-between items-center text-white font-medium">
                Kullanılmayan arama hakkı bir sonraki aya taşınır mı?
                <span className="group-open:rotate-180 transition">▼</span>
              </summary>
              <p className="mt-3 text-gray-400 text-sm">
                Hayır, aylık paket hakkı ayın sonunda sıfırlanır. Kredi paketi ise süresi sınırsızdır.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}


### AÇIKLAMA:
AlanSearch bileşenine Türkçe karakter (ğüşıöç) desteği eklendi. Frontend'te URL encoding ile Türkçe karakterler düzgün backend'e gönderiliyor, backend'te regex pattern ile validasyon yapılıyor. Rate limiting 3 saniyelik bekleme süresi getirerek Google engelini önlüyor. Fiyatlandırma constants.py'de ve pricing page'de güncellenmiş: Aylık 299 TL / 14.99 USD, Kredi paketi 100 TL / 2 USD. Currency toggle ile para birimi seçimi mümkün hale getirildi.