"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPricingPlans, subscribe } from "@/lib/api";
import ClientOnly from "@/components/ClientOnly";
import Navbar from "@/components/Navbar";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  credits: number;
  features: string[];
  recommended: boolean;
  lifetime?: boolean;
}

export default function PricingPage() {
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await getPricingPlans();
        setPlans(data.plans);
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (planId === 'free') {
      alert('Free plan zaten aktif!');
      return;
    }

    setSubscribing(planId);

    try {
      const result = await subscribe(token, planId);
      alert(result.message || 'Ödeme işlemi başlatıldı!');
      
      // Gerçek ödeme gateway'i entegre edildiğinde redirect edilecek
      // router.push(result.redirect_url);
      
      // Demo için direkt dashboard'a yönlendir
      router.push('/dashboard');
    } catch (error: any) {
      alert(error.message || 'Ödeme işlemi başarısız!');
    } finally {
      setSubscribing(null);
    }
  };

  if (!mounted || loading || plansLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black text-white mb-4 neon-text">
              Fiyatlandırma
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              İhtiyacınıza uygun planı seçin. Her zaman upgrade veya downgrade yapabilirsiniz.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative card-dark ${
                  plan.recommended
                    ? 'border-2 border-indigo-500 neon-border'
                    : ''
                }`}
              >
                {/* Recommended Badge */}
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      ÖNERİLEN
                    </div>
                  </div>
                )}

                {/* Lifetime Badge */}
                {plan.lifetime && (
                  <div className="absolute -top-4 right-4">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      ✨ ÖZEL
                    </div>
                  </div>
                )}

                {/* Plan Name */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">
                      ₺{plan.price.toLocaleString()}
                    </span>
                    {!plan.lifetime && plan.price > 0 && (
                      <span className="text-slate-400 text-sm">/ay</span>
                    )}
                  </div>
                  {plan.lifetime && (
                    <div className="text-green-400 text-sm font-semibold mt-1">
                      Tek seferlik ödeme
                    </div>
                  )}
                </div>

                {/* Credits */}
                <div className="mb-6 p-4 bg-slate-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-400 mb-1">
                      {plan.credits === 999999 ? '∞' : plan.credits}
                    </div>
                    <div className="text-xs text-slate-400">
                      {plan.credits === 999999 ? 'Sınırsız Arama' : 'Arama Kredisi'}
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing === plan.id || plan.id === 'free'}
                  className={`w-full py-3 rounded-lg font-bold transition-all ${
                    plan.recommended
                      ? 'btn-primary'
                      : plan.id === 'free'
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {subscribing === plan.id
                    ? 'İşleniyor...'
                    : plan.id === 'free'
                    ? 'Mevcut Plan'
                    : 'Satın Al'}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ / Additional Info */}
          <div className="mt-16 card-dark max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6">💡 Sık Sorulan Sorular</h2>
            <div className="space-y-4 text-slate-300">
              <div>
                <h3 className="font-semibold text-white mb-2">Ödeme güvenli mi?</h3>
                <p className="text-sm text-slate-400">
                  Evet, tüm ödemeler SSL şifrelemesi ile korunmaktadır. Kredi kartı bilgileriniz hiçbir zaman sunucularımızda saklanmaz.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">İptal edebilir miyim?</h3>
                <p className="text-sm text-slate-400">
                  Aylık planlar istediğiniz zaman iptal edilebilir. Kalan kredileriniz kullanım süreniz boyunca geçerli kalır.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Sınırsız plan nedir?</h3>
                <p className="text-sm text-slate-400">
                  Sınırsız plan ile hiçbir kredi kısıtlaması olmadan istediğiniz kadar arama yapabilirsiniz. Ticari kullanım ve API erişimi dahildir.
                </p>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-50">
            <div className="text-slate-500 text-sm">🔒 SSL Güvenli</div>
            <div className="text-slate-500 text-sm">💳 Güvenli Ödeme</div>
            <div className="text-slate-500 text-sm">📧 7/24 Destek</div>
            <div className="text-slate-500 text-sm">✨ Anında Aktivasyon</div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
