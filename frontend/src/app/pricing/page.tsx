'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'credit'>('monthly');

  const plans = {
    monthly: [
      {
        name: 'Başlangıç',
        price: 299,
        currency: '₺',
        period: '/ay',
        usPrice: 14.99,
        usCurrency: '$',
        description: 'Küçük projeler için ideal',
        features: [
          'Aylık 100 arama',
          'Temel AlanSearch',
          'Arama geçmişi',
          'E-posta desteği',
          '7 gün veri tutma'
        ],
        cta: 'Başla',
        highlighted: false
      },
      {
        name: 'Profesyonel',
        price: 799,
        currency: '₺',
        period: '/ay',
        usPrice: 39.99,
        usCurrency: '$',
        description: 'İşletmeler için',
        features: [
          'Aylık 1000 arama',
          'Gelişmiş AlanSearch',
          'Location Search',
          'Arama geçmişi ve analitik',
          'Öncelikli destek',
          '30 gün veri tutma',
          'API erişimi'
        ],
        cta: 'Satın Al',
        highlighted: true
      },
      {
        name: 'Kurumsal',
        price: 2499,
        currency: '₺',
        period: '/ay',
        usPrice: 124.99,
        usCurrency: '$',
        description: 'Kurumlar için özel',
        features: [
          'Sınırsız arama',
          'Tüm özellikler',
          'Özel integration',
          '24/7 canlı destek',
          '90 gün veri tutma',
          'API v2 erişimi',
          'Batch işlem',
          'Kişisel hesap yöneticisi'
        ],
        cta: 'İletişime Geç',
        highlighted: false
      }
    ],
    credit: [
      {
        name: 'Küçük Paket',
        price: 100,
        currency: '₺',
        period: '50 arama',
        usPrice: 2,
        usCurrency: '$',
        description: 'Hızlı deneme için',
        features: [
          '50 arama kredisi',
          '90 gün geçerlilik',
          'AlanSearch kullanımı',
          'E-posta desteği'
        ],
        cta: 'Satın Al',
        highlighted: false
      },
      {
        name: 'Orta Paket',
        price: 250,
        currency: '₺',
        period: '150 arama',
        usPrice: 5,
        usCurrency: '$',
        description: 'Düzenli kullanım için',
        features: [
          '150 arama kredisi',
          '180 gün geçerlilik',
          'AlanSearch + Location',
          'Arama analitik',
          'Öncelikli destek'
        ],
        cta: 'Satın Al',
        highlighted: true
      },
      {
        name: 'Büyük Paket',
        price: 750,
        currency: '₺',
        period: '500 arama',
        usPrice: 15,
        usCurrency: '$',
        description: 'Yoğun kullanım için',
        features: [
          '500 arama kredisi',
          '1 yıl geçerlilik',
          'Tüm arama türleri',
          'Batch işlem',
          'API erişimi',
          '24/7 destek'
        ],
        cta: 'Satın Al',
        highlighted: false
      }
    ]
  };

  const currentPlans = plans[billingCycle];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Fiyatlandırma Planları
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Bütçenize uygun seçeneği bulun
          </p>

          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Aylık Abonelik
            </button>
            <button
              onClick={() => setBillingCycle('credit')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                billingCycle === 'credit'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Kredi Paketi
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {currentPlans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-8 transition-all ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-blue-600 to-blue-700 text-white scale-105 shadow-2xl'
                  : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-yellow-400 text-slate-900 text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                  EN POPÜLERİ
                </div>
              )}

              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className={`text-sm mb-6 ${plan.highlighted ? 'text-blue-100' : 'text-slate-400'}`}>
                {plan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-lg">{plan.currency}</span>
                </div>
                <p className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-400'}`}>
                  {plan.period}
                </p>
                <div className="text-xs mt-2 opacity-75">
                  {plan.usPrice}{plan.usCurrency} (USD)
                </div>
              </div>

              <button
                className={`w-full py-3 rounded-lg font-semibold mb-8 transition-all ${
                  plan.highlighted
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {plan.cta}
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, fidx) => (
                  <div key={fidx} className="flex gap-3">
                    <Check className="w-5 h-5 flex-shrink-0 text-green-400" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Emin değil misiniz?
          </h3>
          <p className="text-slate-300 mb-6">
            Ücretsiz demo hesabı oluşturun ve tüm özellikleri keşfedin
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
            Ücretsiz Başla
          </button>
        </div>
      </div>
    </div>
  );
}