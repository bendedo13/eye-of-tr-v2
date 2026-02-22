"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPricingPlansGrouped } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  credits: number;
  features: string[];
  recommended?: boolean;
  is_one_time?: boolean;
  billing_period?: string;
  shopify_url?: string;
}

interface PricingPageProps {
  params: { locale: string };
}

export default function PricingPage({ params }: PricingPageProps) {
  const locale = params.locale === "tr" ? "tr" : "en";
  const { user, token } = useAuth();
  const router = useRouter();

  const isTR = locale === "tr";
  const currency = isTR ? "TRY" : "USD";

  const t: Record<string, string> = isTR
    ? {
      title: "Fiyatlandırma",
      subtitle: "İhtiyacınıza uygun planı seçin",
      perMonth: "/ay",
      perYear: "/yıl",
      subscribe: "Abone Ol",
      buyCredits: "Kredi Satın Al",
      processing: "İşleniyor...",
      credits: "Kredi",
      contactUs: "Bize Ulaşın",
      questions: "Sorularınız mı var?",
      noShopify: "Shopify ödeme bağlantısı henüz tanımlanmadı.",
      monthlyTitle: "Aylık Abonelik",
      yearlyTitle: "Yıllık Abonelik",
      oneTimeTitle: "Kredi Satın Alma",
      recommended: "Önerilen",
    }
    : {
      title: "Pricing",
      subtitle: "Choose the plan that fits your needs",
      perMonth: "/mo",
      perYear: "/yr",
      subscribe: "Subscribe",
      buyCredits: "Buy Credits",
      processing: "Processing...",
      credits: "Credits",
      contactUs: "Contact Us",
      questions: "Have questions?",
      noShopify: "Shopify checkout URL is not configured yet.",
      monthlyTitle: "Monthly Plan",
      yearlyTitle: "Yearly Plan",
      oneTimeTitle: "Credit Purchase",
      recommended: "Recommended",
    };

  const [processing, setProcessing] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [monthlyPlans, setMonthlyPlans] = useState<PricingPlan[]>([]);
  const [yearlyPlans, setYearlyPlans] = useState<PricingPlan[]>([]);
  const [oneTimePlans, setOneTimePlans] = useState<PricingPlan[]>([]);

  useEffect(() => {
    let active = true;
    setLoadingPlans(true);
    getPricingPlansGrouped(locale, currency)
      .then((data) => {
        if (!active) return;
        setMonthlyPlans(data.monthly || []);
        setYearlyPlans(data.yearly || []);
        setOneTimePlans(data.one_time || []);
      })
      .finally(() => {
        if (!active) return;
        setLoadingPlans(false);
      });
    return () => {
      active = false;
    };
  }, [locale, currency]);

  const handleOpenShopify = (plan: PricingPlan) => {
    if (!user || !token) {
      router.push(`/${locale}/login`);
      return;
    }
    if (!plan.shopify_url) {
      alert(t.noShopify);
      return;
    }
    setProcessing(plan.id);
    window.location.href = plan.shopify_url;
  };

  const renderPlanCard = (plan: PricingPlan, accent: string, buttonText: string, periodLabel?: string) => (
    <div key={plan.id} className={`bg-slate-800/60 border border-slate-700 rounded-3xl p-8 relative overflow-hidden ${plan.recommended ? "ring-2 ring-indigo-500/60" : ""}`}>
      {plan.recommended && (
        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-black uppercase px-4 py-2 rounded-bl-xl">
          {t.recommended}
        </div>
      )}
      <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
      <div className="mb-6">
        <span className="text-4xl font-black text-white">{currency === "TRY" ? "₺" : "$"}{plan.price}</span>
        {periodLabel && <span className="text-slate-400 ml-2">{periodLabel}</span>}
      </div>
      <ul className="space-y-3 mb-8">
        {plan.features?.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className={`mt-0.5 flex-shrink-0 ${accent}`}>&#10003;</span>
            <span>{feature}</span>
          </li>
        ))}
        <li className="flex items-start gap-2 text-sm text-slate-300">
          <span className={`mt-0.5 flex-shrink-0 ${accent}`}>&#10003;</span>
          <span>{t.credits}: {plan.credits}</span>
        </li>
      </ul>
      <button
        onClick={() => handleOpenShopify(plan)}
        disabled={processing === plan.id}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 ${accent.includes("amber") ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black shadow-lg shadow-amber-500/20" : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"}`}
      >
        {processing === plan.id ? t.processing : buttonText}
      </button>
    </div>
  );

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
              {t.title}
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          {loadingPlans ? (
            <div className="text-center text-slate-400">...</div>
          ) : (
            <div className="space-y-12">
              <div>
                <h2 className="text-xl font-black text-white mb-6">{t.monthlyTitle}</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {monthlyPlans.map((plan) => renderPlanCard(plan, "text-indigo-400", t.subscribe, t.perMonth))}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-6">{t.yearlyTitle}</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {yearlyPlans.map((plan) => renderPlanCard(plan, "text-indigo-400", t.subscribe, t.perYear))}
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white mb-6">{t.oneTimeTitle}</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  {oneTimePlans.map((plan) => renderPlanCard(plan, "text-amber-400", t.buyCredits))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-slate-400">
              {t.questions}{" "}
              <a href={`/${locale}/contact`} className="text-indigo-400 hover:underline">
                {t.contactUs}
              </a>
            </p>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
