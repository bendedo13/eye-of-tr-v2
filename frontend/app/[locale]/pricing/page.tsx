"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createGuestBankInquiry, getPricingPlansGrouped, requestBankTransfer, subscribe } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ClientOnly from "@/components/ClientOnly";

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

interface PricingPageProps {
  params: { locale: string };
}

export default function PricingPage({ params }: PricingPageProps) {
  const locale = params.locale || "tr";
  const { user, token } = useAuth();
  const router = useRouter();

  const isTR = locale === "tr";
  const currency = isTR ? "TRY" : "USD";

  const t: Record<string, string> = isTR
    ? {
      title: "Fiyatlandırma",
      subtitle: "İhtiyacınıza uygun planı seçin",
      perMonth: "/ay",
      popular: "Önerilen",
      subscribe: "Abone Ol",
      currentPlan: "Mevcut Plan",
      creditPack: "Kredi Satın Al",
      creditPackDesc: "Abonelik olmadan tek seferlik kredi satın alın",
      buyCredits: "Kredi Satın Al",
      normalSearch: "Normal Arama",
      detailedSearch: "Detaylı Arama",
      locationSearch: "Konum Tespiti",
      dailyLimit: "Günlük Limit",
      support: "Destek",
      apiAccess: "API Erişimi",
      commercialUse: "Ticari Kullanım",
      noBlur: "Blur Yok",
      bankTransfer: "Havale / EFT / FAST",
      cardPayment: "Kredi Kartı",
      referralBanner: "3 kişi davet et, 1 detaylı + 2 normal arama kazan!",
      processing: "İşleniyor...",
      loginRequired: "Giriş Yap",
      bankInfo: "Banka Bilgileri",
      bankDesc: "Ödemeyi yaptıktan sonra aşağıdaki formdan talep gönderin.",
      sendTransfer: "Gönderdim",
      hideForm: "Formu Gizle",
      purchaseType: "Satın Alma Türü",
      plan: "Plan",
      credit: "Kredi",
      selectPlan: "Plan seçiniz",
      creditAmount: "Kredi Miktarı",
      paymentAmount: "Ödeme Tutarı (TRY)",
      note: "Açıklama (Opsiyonel)",
      send: "GÖNDER",
      sending: "Gönderiliyor...",
      guestTitle: "Havale / EFT Bilgileri",
      guestDesc: "Bilgileri görmek için kayıt olmanız gerekir.",
      contact: "İletişim",
      name: "Ad Soyad",
      email: "E-posta",
      phone: "Telefon",
      desiredPlan: "İstenen Paket",
      message: "Mesaj",
      unlimited: "Sınırsız",
      perDay: "/gün",
      contactUs: "Bize Ulaşın",
      questions: "Sorularınız mı var?",
      copyIban: "IBAN Kopyala",
      copied: "Kopyalandı",
      noSubscription: "Abonelik gerektirmez",
      monthlyPlan: "Aylık Abonelik",
      monthlyPlanDesc: "Tüm özelliklere tam erişim",
      perCredit: "/ kredi",
      creditDesc: "İstediğiniz kadar kredi satın alın",
      alansearch: "Alan Arama",
      locationIntel: "Konum Tespiti",
      faceSearch: "Yüz Arama",
      prioritySupport: "Öncelikli Destek",
      noBlurResults: "Bulanıksız Sonuçlar",
      unlimitedAccess: "Sınırsız Erişim",
      bestValue: "En Avantajlı",
      flexible: "Esnek Kullanım",
      payAsYouGo: "Kullandıkça Öde",
      noCommitment: "Taahhüt Yok",
      instantCredit: "Anında Kredi Yükleme",
      oneTimePayment: "Tek Seferlik Ödeme",
    }
    : {
      title: "Pricing",
      subtitle: "Choose the plan that fits your needs",
      perMonth: "/mo",
      popular: "Recommended",
      subscribe: "Subscribe",
      currentPlan: "Current Plan",
      creditPack: "Buy Credits",
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
      paymentAmount: "Payment Amount (USD)",
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
      monthlyPlan: "Monthly Subscription",
      monthlyPlanDesc: "Full access to all features",
      perCredit: "/ credit",
      creditDesc: "Buy as many credits as you need",
      alansearch: "AlanSearch",
      locationIntel: "Location Intel",
      faceSearch: "Face Search",
      prioritySupport: "Priority Support",
      noBlurResults: "No Blur Results",
      unlimitedAccess: "Unlimited Access",
      bestValue: "Best Value",
      flexible: "Flexible Usage",
      payAsYouGo: "Pay As You Go",
      noCommitment: "No Commitment",
      instantCredit: "Instant Credit Loading",
      oneTimePayment: "One-Time Payment",
    };

  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);

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

  // Credit quantity for purchase
  const [creditQty, setCreditQty] = useState(5);

  useEffect(() => {
    // Simulating plan load
    const timer = setTimeout(() => setLoadingPlans(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const subscriptionPrice = isTR ? "299" : "14.99";
  const subscriptionCurrency = isTR ? "₺" : "$";
  const creditPrice = isTR ? "54.99" : "2";
  const creditCurrencySymbol = isTR ? "₺" : "$";

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

  const handleBuyCredits = async () => {
    if (!user || !token) {
      router.push(`/${locale}/login`);
      return;
    }
    setProcessingPlan("credits");
    try {
      const result: any = await subscribe(token, `credit_pack_${creditQty}`, currency);
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
      setBankError(isTR ? "Geçersiz tutar." : "Invalid amount.");
      return;
    }
    const payload: any = { amount, currency: "TRY", note: bankNote || undefined };
    if (bankPurchaseType === "plan") {
      payload.plan_id = "pro_monthly";
    } else {
      const credits = Number(bankCredits || 0);
      if (!Number.isFinite(credits) || credits <= 0) {
        setBankError(isTR ? "Geçersiz kredi miktarı." : "Invalid credit amount.");
        return;
      }
      payload.credits = credits;
    }
    setBankSubmitting(true);
    try {
      const result: any = await requestBankTransfer(token, payload);
      setBankSuccess(isTR
        ? `Talep alındı. Referans ID: ${result?.request_id || "-"}`
        : `Request received. Reference ID: ${result?.request_id || "-"}`
      );
      setShowBankForm(false);
      setBankAmount("");
      setBankCredits("");
      setBankNote("");
    } catch (error: any) {
      setBankError(error?.message || (isTR ? "Talep gönderilemedi." : "Request failed."));
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
      setGuestSuccess(isTR ? "Talebiniz alındı." : "Your request has been received.");
      setGuestOpen(false);
      setGuestForm({ name: "", email: "", phone: "", desired: "", message: "" });
    } catch (err: any) {
      setGuestError(err?.message || "Error");
    } finally {
      setGuestSubmitting(false);
    }
  };

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
          <div className="text-center mb-10">
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
          <div className="max-w-3xl mx-auto mb-8">
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
                        <div><strong>{isTR ? "Banka:" : "Bank:"}</strong> Ziraat Bankası</div>
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

                      {bankPurchaseType === "credits" && (
                        <div className="space-y-2">
                          <label className="text-sm text-slate-400 font-semibold">{t.creditAmount}</label>
                          <input
                            type="number"
                            min={1}
                            value={bankCredits}
                            onChange={(e) => setBankCredits(e.target.value)}
                            className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                            placeholder="10"
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
                          placeholder={isTR ? "299" : "14.99"}
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

          {/* Card Payment — Two Cards Side by Side */}
          {paymentMethod === "card" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-10">

              {/* ── Plan 1: Aylık Abonelik ── */}
              <div className="relative bg-slate-800 rounded-2xl p-8 border border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/30 hover:scale-[1.02] transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  {t.bestValue}
                </div>

                <h3 className="text-2xl font-black text-white mb-1 mt-2">
                  {t.monthlyPlan}
                </h3>
                <p className="text-slate-400 text-sm mb-6">{t.monthlyPlanDesc}</p>

                <div className="mb-6">
                  <span className="text-5xl font-black text-white">
                    {isTR ? `${subscriptionPrice} ₺` : `$${subscriptionPrice}`}
                  </span>
                  <span className="text-slate-400 text-sm ml-1">{t.perMonth}</span>
                </div>

                {/* Özellikler */}
                <ul className="space-y-3 mb-8">
                  {[
                    isTR ? "Sınırsız Normal Arama" : "Unlimited Normal Searches",
                    isTR ? "Sınırsız Detaylı Arama" : "Unlimited Detailed Searches",
                    `${t.alansearch} — ${isTR ? "Sınırsız" : "Unlimited"}`,
                    `${t.locationIntel} — ${isTR ? "Sınırsız" : "Unlimited"}`,
                    `${t.faceSearch} — ${isTR ? "Sınırsız" : "Unlimited"}`,
                    t.noBlurResults,
                    t.prioritySupport,
                    `${t.dailyLimit}: 50${t.perDay}`,
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe("pro_monthly")}
                  disabled={processingPlan === "pro_monthly"}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                >
                  {processingPlan === "pro_monthly" ? t.processing : t.subscribe}
                </button>
              </div>

              {/* ── Plan 2: Kredi Satın Al ── */}
              <div className="relative bg-slate-800 rounded-2xl p-8 border border-amber-500/30 hover:scale-[1.02] transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                  {t.flexible}
                </div>

                <h3 className="text-2xl font-black text-white mb-1 mt-2">
                  {t.creditPack}
                </h3>
                <p className="text-slate-400 text-sm mb-6">{t.creditDesc}</p>

                <div className="mb-6">
                  <span className="text-5xl font-black text-white">
                    {isTR ? `${creditPrice} ₺` : `$${creditPrice}`}
                  </span>
                  <span className="text-slate-400 text-sm ml-1">{t.perCredit}</span>
                </div>

                {/* Kredi Miktarı Seçimi */}
                <div className="mb-6">
                  <label className="text-sm text-slate-400 font-semibold mb-2 block">
                    {t.creditAmount}
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[1, 5, 10, 25].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setCreditQty(qty)}
                        className={`py-2 rounded-lg font-bold text-sm transition-all ${creditQty === qty
                          ? "bg-amber-500 text-black"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                          }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                  <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-center">
                    <span className="text-slate-400 text-sm">{isTR ? "Toplam:" : "Total:"} </span>
                    <span className="text-2xl font-black text-white">
                      {isTR
                        ? `${(creditQty * 54.99).toFixed(2)} ₺`
                        : `$${(creditQty * 2).toFixed(2)}`
                      }
                    </span>
                  </div>
                </div>

                {/* Özellikler */}
                <ul className="space-y-3 mb-8">
                  {[
                    t.payAsYouGo,
                    t.noCommitment,
                    t.instantCredit,
                    t.oneTimePayment,
                    t.noSubscription,
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">&#10003;</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={handleBuyCredits}
                  disabled={processingPlan === "credits"}
                  className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black shadow-lg shadow-amber-500/20"
                >
                  {processingPlan === "credits" ? t.processing : t.buyCredits}
                </button>
              </div>
            </div>
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
