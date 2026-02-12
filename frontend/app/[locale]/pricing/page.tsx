"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createGuestBankInquiry, getPricingPlansGrouped, requestBankTransfer, subscribe } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";
import { use } from "react";

interface PricingPlan {
  id: string;
  name: any;
  price_try: number;
  price_usd: number;
  credits: number;
  search_normal: number;
  search_detailed: number;
  search_location: number;
  daily_limit: number;
  features?: any;
  recommended?: boolean;
  is_one_time?: boolean;
  billing_period?: string;
  discount_pct?: number;
  tier?: string;
}

export default function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params) as { locale: string };
  const { user, token } = useAuth();
  const router = useRouter();

  const isTR = locale === "tr";
  const currency = isTR ? "TRY" : "USD";

  const t: Record<string, string> = isTR
    ? {
      title: "Fiyatlandirma",
      subtitle: "Ihtiyaciniza uygun plani secin",
      monthly: "Aylik",
      yearly: "Yillik",
      yearlySave: "%19 indirim - sinirli sure",
      perMonth: "/ay",
      perYear: "/yil",
      popular: "En Populer",
      getStarted: "Baslayın",
      subscribe: "Abone Ol",
      currentPlan: "Mevcut Plan",
      creditPack: "Kredi Paketi",
      creditPackDesc: "Abonelik olmadan tek seferlik satin alin",
      buyCredits: "Kredi Satin Al",
      normalSearch: "Normal Arama",
      detailedSearch: "Detayli Arama",
      locationSearch: "Konum Tespiti",
      dailyLimit: "Gunluk Limit",
      support: "Destek",
      apiAccess: "API Erisimi",
      commercialUse: "Ticari Kullanim",
      noBlur: "Blur Yok",
      bankTransfer: "Havale / EFT / FAST",
      cardPayment: "Kredi Karti",
      referralBanner: "3 kisi davet et, 1 detayli + 2 normal arama kazan!",
      free: "Ucretsiz Deneme",
      freeDesc: "1 ucretsiz arama hakki",
      processing: "Isleniyor...",
      loginRequired: "Giris Yap",
      bankInfo: "Banka Bilgileri",
      bankDesc: "Odemeyi yaptiktan sonra asagidaki formdan talep gonderin.",
      sendTransfer: "Gonderdim",
      hideForm: "Formu Gizle",
      purchaseType: "Satin Alma Turu",
      plan: "Plan",
      credit: "Kredi",
      selectPlan: "Plan seciniz",
      creditAmount: "Kredi Miktari",
      paymentAmount: "Odeme Tutari (TRY)",
      note: "Aciklama (Opsiyonel)",
      send: "GONDER",
      sending: "Gonderiliyor...",
      guestTitle: "Havale / EFT Bilgileri",
      guestDesc: "Bilgileri gormek icin kayit olmaniz gerekir.",
      contact: "Iletisim",
      name: "Ad Soyad",
      email: "E-posta",
      phone: "Telefon",
      desiredPlan: "Istenen Paket",
      message: "Mesaj",
      unlimited: "Sinirsiz",
      perDay: "/gun",
      contactUs: "Bize Ulasin",
      questions: "Sorulariniz mi var?",
      copyIban: "IBAN Kopyala",
      copied: "Kopyalandi",
      noSubscription: "Abonelik gerektirmez",
    }
    : {
      title: "Pricing",
      subtitle: "Choose the plan that fits your needs",
      monthly: "Monthly",
      yearly: "Yearly",
      yearlySave: "19% off - limited time",
      perMonth: "/mo",
      perYear: "/yr",
      popular: "Most Popular",
      getStarted: "Get Started",
      subscribe: "Subscribe",
      currentPlan: "Current Plan",
      creditPack: "Credit Pack",
      creditPackDesc: "One-time purchase, no subscription needed",
      buyCredits: "Buy Credits",
      normalSearch: "Normal Search",
      detailedSearch: "Detailed Search",
      locationSearch: "Location Intel",
      dailyLimit: "Daily Limit",
      support: "Support",
      apiAccess: "API Access",
      commercialUse: "Commercial Use",
      noBlur: "No Blur",
      bankTransfer: "Bank Transfer",
      cardPayment: "Credit Card",
      referralBanner: "Invite 3 friends, earn 1 detailed + 2 normal searches!",
      free: "Free Trial",
      freeDesc: "1 free search included",
      processing: "Processing...",
      loginRequired: "Login",
      bankInfo: "Bank Details",
      bankDesc: "After making the payment, submit a request via the form below.",
      sendTransfer: "I Sent It",
      hideForm: "Hide Form",
      purchaseType: "Purchase Type",
      plan: "Plan",
      credit: "Credit",
      selectPlan: "Select a plan",
      creditAmount: "Credit Amount",
      paymentAmount: "Payment Amount (TRY)",
      note: "Note (Optional)",
      send: "SEND",
      sending: "Sending...",
      guestTitle: "Bank Transfer Info",
      guestDesc: "Please register to see bank details.",
      contact: "Contact",
      name: "Full Name",
      email: "Email",
      phone: "Phone",
      desiredPlan: "Desired Plan",
      message: "Message",
      unlimited: "Unlimited",
      perDay: "/day",
      contactUs: "Contact Us",
      questions: "Have questions?",
      copyIban: "Copy IBAN",
      copied: "Copied",
      noSubscription: "No subscription needed",
    };

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [monthlyPlans, setMonthlyPlans] = useState<PricingPlan[]>([]);
  const [yearlyPlans, setYearlyPlans] = useState<PricingPlan[]>([]);
  const [creditPack, setCreditPack] = useState<PricingPlan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Bank transfer states
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankPurchaseType, setBankPurchaseType] = useState<"plan" | "credits">("plan");
  const [bankPlanId, setBankPlanId] = useState("");
  const [bankCredits, setBankCredits] = useState("");
  const [bankAmount, setBankAmount] = useState("");
  const [bankNote, setBankNote] = useState("");
  const [bankSubmitting, setBankSubmitting] = useState(false);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);
  const [bankError, setBankError] = useState<string | null>(null);
  const [ibanCopied, setIbanCopied] = useState(false);

  // Guest form
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [guestSuccess, setGuestSuccess] = useState<string | null>(null);
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: "",
    email: "",
    phone: "",
    desired: "",
    message: "",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data: any = await getPricingPlansGrouped(locale, currency);
      if (data) {
        setMonthlyPlans(
          (data.monthly || []).filter((p: PricingPlan) => p && p.id !== "free")
        );
        setYearlyPlans(data.yearly || []);
        if (data.one_time && data.one_time.length > 0) {
          setCreditPack(data.one_time[0]);
        }
      }
    } catch (err) {
      console.error("Fetch plans failed:", err);
      // Fallback plans
      const fallbacks: PricingPlan[] = [
        {
          id: "basic_monthly",
          name: { tr: "Basic Aylik", en: "Basic Monthly" },
          tier: "basic",
          price_try: 139,
          price_usd: 9.99,
          credits: 11,
          search_normal: 10,
          search_detailed: 1,
          search_location: 0,
          daily_limit: 5,
          features: {
            tr: ["10 normal arama", "1 detayli arama", "E-posta destek"],
            en: ["10 normal searches", "1 detailed search", "Email support"],
          },
        },
        {
          id: "pro_monthly",
          name: { tr: "Pro Aylik", en: "Pro Monthly" },
          tier: "pro",
          price_try: 399,
          price_usd: 24.99,
          credits: 55,
          search_normal: 50,
          search_detailed: 5,
          search_location: 10,
          daily_limit: 15,
          recommended: true,
          features: {
            tr: ["50 normal arama", "5 detayli arama", "10 konum tespiti", "Oncelikli destek", "Blur yok"],
            en: ["50 normal searches", "5 detailed searches", "10 location intel", "Priority support", "No blur"],
          },
        },
        {
          id: "unlimited_monthly",
          name: { tr: "Sinirsiz Aylik", en: "Unlimited Monthly" },
          tier: "unlimited",
          price_try: 3999,
          price_usd: 199,
          credits: 999999,
          search_normal: 999999,
          search_detailed: 999999,
          search_location: 999999,
          daily_limit: 20,
          features: {
            tr: ["Sinirsiz arama", "Gunluk 20 arama", "7/24 ozel destek", "API erisimi"],
            en: ["Unlimited searches", "20 searches/day", "24/7 VIP support", "API access"],
          },
        },
      ];
      setMonthlyPlans(fallbacks);
    } finally {
      setLoadingPlans(false);
    }
  };

  const getPlanName = (name: any): string => {
    if (!name) return "Plan";
    if (typeof name === "string") return name;
    if (name?.[locale]) return name[locale];
    if (name?.tr) return name.tr;
    if (name?.en) return name.en;
    return "Plan";
  };

  const getFeatures = (features: any): string[] => {
    if (!features) return [];
    if (Array.isArray(features)) return features;
    if (features?.[locale] && Array.isArray(features[locale])) return features[locale];
    if (features?.tr && Array.isArray(features.tr)) return features.tr;
    return [];
  };

  const getPrice = (plan: PricingPlan): number => {
    return isTR ? plan.price_try : plan.price_usd;
  };

  const formatPrice = (plan: PricingPlan): string => {
    const price = getPrice(plan);
    if (price === 0) return isTR ? "0 TL" : "$0";
    if (isTR) return `${price.toLocaleString("tr-TR")} TL`;
    return `$${price}`;
  };

  const activePlans = billingPeriod === "monthly" ? monthlyPlans : yearlyPlans;

  const handleSubscribe = async (planId: string) => {
    if (!user || !token) {
      router.push(`/${locale}/login`);
      return;
    }
    setProcessingPlan(planId);
    try {
      const result: any = await subscribe(token, planId, currency);
      if (result?.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        alert(result?.message || "OK");
      }
    } catch (error: any) {
      alert(error?.message || "Error");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleBankRequest = async () => {
    if (!user || !token) {
      router.push(`/${locale}/login`);
      return;
    }
    setBankError(null);
    setBankSuccess(null);
    const amount = Number(bankAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setBankError("Gecersiz tutar.");
      return;
    }
    const payload: any = { amount, currency: "TRY", note: bankNote || undefined };
    if (bankPurchaseType === "plan") {
      if (!bankPlanId) {
        setBankError("Lutfen bir plan secin.");
        return;
      }
      payload.plan_id = bankPlanId;
    } else {
      const credits = Number(bankCredits || 0);
      if (!Number.isFinite(credits) || credits <= 0) {
        setBankError("Gecersiz kredi miktari.");
        return;
      }
      payload.credits = credits;
    }
    setBankSubmitting(true);
    try {
      const result: any = await requestBankTransfer(token, payload);
      setBankSuccess(`Talep alindi. Referans ID: ${result?.request_id || "-"}`);
      setShowBankForm(false);
      setBankAmount("");
      setBankCredits("");
      setBankNote("");
    } catch (error: any) {
      setBankError(error?.message || "Talep gonderilemedi.");
    } finally {
      setBankSubmitting(false);
    }
  };

  const copyIban = async () => {
    try {
      await navigator.clipboard.writeText("TR550001009010879130805001");
      setIbanCopied(true);
      setTimeout(() => setIbanCopied(false), 1500);
    } catch {
      setIbanCopied(false);
    }
  };

  const handleGuestSubmit = async () => {
    setGuestError(null);
    setGuestSuccess(null);
    if (!guestForm.name.trim() || !guestForm.email.trim()) {
      setGuestError(isTR ? "Ad soyad ve e-posta gerekli." : "Name and email are required.");
      return;
    }
    setGuestSubmitting(true);
    try {
      await createGuestBankInquiry({
        name: guestForm.name.trim(),
        email: guestForm.email.trim(),
        phone: guestForm.phone.trim() || undefined,
        desired_plan: guestForm.desired.trim() || undefined,
        desired_credits: undefined,
        message: guestForm.message.trim() || undefined,
      });
      setGuestSuccess(isTR ? "Talebiniz alindi." : "Your request has been received.");
      setGuestOpen(false);
      setGuestForm({ name: "", email: "", phone: "", desired: "", message: "" });
    } catch (err: any) {
      setGuestError(err?.message || "Error");
    } finally {
      setGuestSubmitting(false);
    }
  };

  const allPlans = [...monthlyPlans, ...yearlyPlans];

  if (loadingPlans) {
    return (
      <ClientOnly>
        <div className="min-h-screen bg-slate-900">
          <Navbar />
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
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
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              {t.title}
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          {/* Referral Banner */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl px-6 py-4 text-center">
              <p className="text-amber-300 font-semibold text-sm">
                {t.referralBanner}
              </p>
            </div>
          </div>

          {/* Payment Method Toggle */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-2">
              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${paymentMethod === "card"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
              >
                {t.cardPayment}
              </button>
              <button
                onClick={() => setPaymentMethod("bank")}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${paymentMethod === "bank"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                  }`}
              >
                {t.bankTransfer}
              </button>
            </div>
          </div>

          {/* Bank Transfer Section */}
          {paymentMethod === "bank" && (
            <div className="max-w-4xl mx-auto mb-10 bg-slate-800/60 border border-slate-700 rounded-2xl p-6 md:p-8">
              {user ? (
                <div>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div>
                      <h2 className="text-xl font-black text-white mb-2">{t.bankInfo}</h2>
                      <p className="text-slate-400 text-sm mb-4">{t.bankDesc}</p>
                      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 space-y-2">
                        <div><strong>{isTR ? "Ad Soyad:" : "Name:"}</strong> Alper Inal</div>
                        <div><strong>{isTR ? "Banka:" : "Bank:"}</strong> Ziraat Bankasi</div>
                        <div className="flex items-center gap-3">
                          <div><strong>IBAN:</strong> TR550001009010879130805001</div>
                          <button
                            onClick={copyIban}
                            className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                          >
                            {ibanCopied ? t.copied : t.copyIban}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-[200px]">
                      <button
                        onClick={() => setShowBankForm((v) => !v)}
                        className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {showBankForm ? t.hideForm : t.sendTransfer}
                      </button>
                    </div>
                  </div>

                  {bankSuccess && (
                    <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-4 text-sm">
                      {bankSuccess}
                    </div>
                  )}
                  {bankError && (
                    <div className="mt-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
                      {bankError}
                    </div>
                  )}

                  {showBankForm && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-sm text-slate-400 font-semibold">{t.purchaseType}</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setBankPurchaseType("plan")}
                            className={`flex-1 py-2 rounded-lg font-bold ${bankPurchaseType === "plan" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-200"
                              }`}
                          >
                            {t.plan}
                          </button>
                          <button
                            onClick={() => setBankPurchaseType("credits")}
                            className={`flex-1 py-2 rounded-lg font-bold ${bankPurchaseType === "credits" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-200"
                              }`}
                          >
                            {t.credit}
                          </button>
                        </div>
                      </div>

                      {bankPurchaseType === "plan" ? (
                        <div className="space-y-2">
                          <label className="text-sm text-slate-400 font-semibold">{t.selectPlan}</label>
                          <select
                            value={bankPlanId}
                            onChange={(e) => setBankPlanId(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                          >
                            <option value="">{t.selectPlan}</option>
                            {allPlans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {getPlanName(p.name)} - {formatPrice(p)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-sm text-slate-400 font-semibold">{t.creditAmount}</label>
                          <input
                            type="number"
                            min={1}
                            value={bankCredits}
                            onChange={(e) => setBankCredits(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                            placeholder="200"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">{t.paymentAmount}</label>
                        <input
                          type="number"
                          min={1}
                          value={bankAmount}
                          onChange={(e) => setBankAmount(e.target.value)}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                          placeholder="2999"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-slate-400 font-semibold">{t.note}</label>
                        <textarea
                          value={bankNote}
                          onChange={(e) => setBankNote(e.target.value)}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 min-h-[110px]"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <button
                          onClick={handleBankRequest}
                          disabled={bankSubmitting}
                          className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                        >
                          {bankSubmitting ? t.sending : t.send}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-black text-white">{t.guestTitle}</h2>
                  <p className="text-slate-400 text-sm">{t.guestDesc}</p>
                  <button
                    onClick={() => setGuestOpen((v) => !v)}
                    className="px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {t.contact}
                  </button>

                  {guestSuccess && (
                    <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl p-4 text-sm">
                      {guestSuccess}
                    </div>
                  )}
                  {guestError && (
                    <div className="mt-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl p-4 text-sm">
                      {guestError}
                    </div>
                  )}

                  {guestOpen && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">{t.name}</label>
                        <input
                          value={guestForm.name}
                          onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">{t.email}</label>
                        <input
                          value={guestForm.email}
                          onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">{t.phone}</label>
                        <input
                          value={guestForm.phone}
                          onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">{t.desiredPlan}</label>
                        <input
                          value={guestForm.desired}
                          onChange={(e) => setGuestForm({ ...guestForm, desired: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-slate-400 font-semibold">{t.message}</label>
                        <textarea
                          value={guestForm.message}
                          onChange={(e) => setGuestForm({ ...guestForm, message: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 min-h-[110px]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <button
                          onClick={handleGuestSubmit}
                          disabled={guestSubmitting}
                          className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                        >
                          {guestSubmitting ? t.sending : t.send}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Billing Period Toggle */}
          {paymentMethod === "card" && (
            <>
              <div className="flex justify-center mb-10">
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-1.5 flex gap-1 items-center">
                  <button
                    onClick={() => setBillingPeriod("monthly")}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${billingPeriod === "monthly"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    {t.monthly}
                  </button>
                  <button
                    onClick={() => setBillingPeriod("yearly")}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${billingPeriod === "yearly"
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                      }`}
                  >
                    {t.yearly}
                    <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                      {t.yearlySave}
                    </span>
                  </button>
                </div>
              </div>

              {/* Free Trial Banner */}
              <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{t.free}</p>
                    <p className="text-slate-400 text-sm">{t.freeDesc}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!user) router.push(`/${locale}/register`);
                      else router.push(`/${locale}/search`);
                    }}
                    className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-sm"
                  >
                    {t.getStarted}
                  </button>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {activePlans.map((plan) => {
                  const isUnlimited = plan.id.startsWith("unlimited");
                  const isPro = plan.recommended;
                  return (
                    <div
                      key={plan.id}
                      className={`relative bg-slate-800 rounded-2xl p-6 border transition-all hover:scale-[1.02] ${isPro
                        ? "border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/30"
                        : "border-slate-700"
                        }`}
                    >
                      {isPro && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                          {t.popular}
                        </div>
                      )}
                      {(plan as any).discount_pct > 0 && (
                        <div className="absolute -top-3 right-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                          %{(plan as any).discount_pct} {isTR ? "indirim" : "off"}
                        </div>
                      )}

                      <h3 className="text-xl font-bold text-white mb-1">
                        {getPlanName(plan.name).replace(/ (Aylik|Yillik|Monthly|Yearly)$/i, "")}
                      </h3>

                      <div className="mb-5">
                        <span className="text-4xl font-black text-white">
                          {formatPrice(plan)}
                        </span>
                        <span className="text-slate-400 text-sm">
                          {billingPeriod === "yearly" ? t.perYear : t.perMonth}
                        </span>
                      </div>

                      {/* Search Type Breakdown */}
                      <div className="bg-slate-700/30 rounded-xl p-4 mb-5 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">{t.normalSearch}</span>
                          <span className="text-white font-bold">
                            {isUnlimited ? t.unlimited : plan.search_normal}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">{t.detailedSearch}</span>
                          <span className="text-white font-bold">
                            {isUnlimited ? t.unlimited : plan.search_detailed}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">{t.locationSearch}</span>
                          <span className="text-white font-bold">
                            {isUnlimited ? t.unlimited : plan.search_location || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-slate-600 pt-2">
                          <span className="text-slate-400">{t.dailyLimit}</span>
                          <span className="text-white font-bold">
                            {plan.daily_limit}{t.perDay}
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 mb-6">
                        {getFeatures(plan.features).map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-green-400 mt-0.5 flex-shrink-0">&#10003;</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={processingPlan === plan.id}
                        className={`w-full py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${isPro
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                          }`}
                      >
                        {processingPlan === plan.id ? t.processing : t.subscribe}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Credit Pack */}
              {creditPack && (
                <div className="max-w-2xl mx-auto mb-10">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-800/80 border border-amber-500/30 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">
                          {t.creditPack}
                        </h3>
                        <p className="text-slate-400 text-sm mb-3">
                          {t.creditPackDesc}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="bg-slate-700/50 px-3 py-1 rounded-lg text-slate-200">
                            {creditPack.search_normal} {t.normalSearch}
                          </span>
                          <span className="bg-slate-700/50 px-3 py-1 rounded-lg text-slate-200">
                            {creditPack.search_detailed} {t.detailedSearch}
                          </span>
                          <span className="bg-slate-700/50 px-3 py-1 rounded-lg text-slate-200">
                            {creditPack.search_location} {t.locationSearch}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-white mb-2">
                          {formatPrice(creditPack)}
                        </div>
                        <p className="text-slate-500 text-xs mb-3">{t.noSubscription}</p>
                        <button
                          onClick={() => handleSubscribe(creditPack.id)}
                          disabled={processingPlan === creditPack.id}
                          className="px-6 py-3 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                        >
                          {processingPlan === creditPack.id ? t.processing : t.buyCredits}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* FAQ Link */}
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
