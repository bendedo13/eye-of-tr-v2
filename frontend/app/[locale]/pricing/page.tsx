"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPricingPlans, subscribe } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";

interface PricingPlan {
  id: string;
  name: any;
  price: number;
  credits: number;
  currency?: string;
  features?: any;
  recommended?: boolean;
  isPopular?: boolean;
}

import { use } from "react";

export default function PricingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { user, token, mounted, loading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await getPricingPlans();
      const formattedData: PricingPlan[] = (data || []).map((plan: any) => ({
        id: plan.id || "",
        name: plan.name || "Plan",
        price: plan.price || 0,
        credits: plan.credits || 0,
        currency: plan.currency || "USD",
        features: plan.features || [],
        recommended: plan.recommended || plan.isPopular || false,
        isPopular: plan.isPopular || false,
      }));
      setPlans(formattedData);
    } catch (error) {
      console.error("Plans fetch error:", error);
      // Varsayılan planlar
      setPlans([
        { id: "free", name: "Ücretsiz", price: 0, credits: 10, currency: "USD", features: ["10 Arama Kredisi", "Temel Destek"], recommended: false },
        { id: "basic", name: "Basic", price: 9.99, credits: 50, currency: "USD", features: ["50 Arama Kredisi", "E-posta Destek", "Hızlı Sonuçlar"], recommended: false },
        { id: "pro", name: "Pro", price: 29.99, credits: 200, currency: "USD", features: ["200 Arama Kredisi", "Öncelikli Destek", "API Erişimi", "Toplu Arama"], recommended: true },
        { id: "enterprise", name: "Enterprise", price: 99.99, credits: 1000, currency: "USD", features: ["1000 Arama Kredisi", "7/24 Destek", "Özel API", "Sınırsız Dork"], recommended: false },
      ]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user || !token) {
      router.push(`/${locale}/login`);
      return;
    }

    setProcessingPlan(planId);
    try {
      const result: any = await subscribe(token, planId);
      if (result?.checkout_url) {
        // Redirect to LemonSqueezy Checkout
        window.location.href = result.checkout_url;
      } else {
        alert(result?.message || "Ödeme işlemi başlatıldı!");
      }
    } catch (error: any) {
      alert(error?.message || "Bir hata oluştu");
    } finally {
      setProcessingPlan(null);
    }
  };

  const getPlanName = (name: any): string => {
    if (typeof name === "string") return name;
    if (name?.tr) return name.tr;
    if (name?.en) return name.en;
    return "Plan";
  };

  const getPlanFeatures = (features: any): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (features?.tr && Array.isArray(features.tr)) return features.tr;
    if (features?.en && Array.isArray(features.en)) return features.en;
    return [];
  };

  if (loadingPlans) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-slate-900">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
      </ClientOnly>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Fiyatlandırma
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              İhtiyacınıza uygun planı seçin ve hemen aramaya başlayın
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-slate-800 rounded-2xl p-6 border transition-all hover:scale-105 ${plan.recommended || plan.isPopular
                  ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
                  : "border-slate-700"
                  }`}
              >
                {/* Popular Badge */}
                {(plan.recommended || plan.isPopular) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Popüler
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-xl font-bold text-white mb-2">
                  {getPlanName(plan.name)}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  {plan.price > 0 && <span className="text-slate-400 text-sm">/ay</span>}
                </div>

                {/* Credits */}
                <div className="bg-slate-700/50 rounded-xl p-3 mb-6">
                  <div className="text-2xl font-bold text-indigo-400">{plan.credits}</div>
                  <div className="text-slate-400 text-sm">Arama Kredisi</div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {getPlanFeatures(plan.features).map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processingPlan === plan.id}
                  className={`w-full py-3 rounded-xl font-bold transition-all ${plan.recommended || plan.isPopular
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-white"
                    } disabled:opacity-50`}
                >
                  {processingPlan === plan.id ? "İşleniyor..." : plan.price === 0 ? "Ücretsiz Başla" : "Satın Al"}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ or Info */}
          <div className="mt-16 text-center">
            <p className="text-slate-400">
              Sorularınız mı var?{" "}
              <a href={`/${locale}/contact`} className="text-indigo-400 hover:underline">
                Bize ulaşın
              </a>
            </p>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}