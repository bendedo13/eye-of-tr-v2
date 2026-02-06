"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createGuestBankInquiry, getPricingPlans, requestBankTransfer, subscribe } from "@/lib/api";
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

    const payload: {
      plan_id?: string | null;
      credits?: number | null;
      amount: number;
      currency?: string;
      note?: string;
    } = { amount, currency: "TRY", note: bankNote || undefined };

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
      setGuestError("Ad soyad ve e-posta gerekli.");
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
      setGuestSuccess("Talebiniz alindi. En kisa surede iletisime gecilecektir.");
      setGuestOpen(false);
      setGuestForm({ name: "", email: "", phone: "", desired: "", message: "" });
    } catch (err: any) {
      setGuestError(err?.message || "Talep gonderilemedi.");
    } finally {
      setGuestSubmitting(false);
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

          {/* Payment Method */}
          <div className="max-w-3xl mx-auto mb-10">
            <div className="flex flex-col sm:flex-row gap-4 bg-slate-800/60 border border-slate-700 rounded-2xl p-2">
              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  paymentMethod === "card"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Kredi Karti
              </button>
              <button
                onClick={() => setPaymentMethod("bank")}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  paymentMethod === "bank"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
              >
                Havale / EFT / FAST
              </button>
            </div>
          </div>

          {paymentMethod === "bank" && (
            <div className="max-w-4xl mx-auto mb-12 bg-slate-800/60 border border-slate-700 rounded-2xl p-6 md:p-8">
              {user ? (
                <div>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div>
                      <h2 className="text-xl font-black text-white mb-2">Banka Bilgileri</h2>
                      <p className="text-slate-400 text-sm mb-4">
                        Odemeyi yaptiktan sonra asagidaki formdan talep gonderin. Onaylandiginda kredi veya plan aktif edilir.
                      </p>
                      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 space-y-2">
                        <div><strong>Ad Soyad:</strong> Alper İnal</div>
                        <div><strong>Banka:</strong> Ziraat Bankasi</div>
                        <div className="flex items-center gap-3">
                          <div><strong>IBAN:</strong> TR550001009010879130805001</div>
                          <button onClick={copyIban} className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-white">
                            {ibanCopied ? "Kopyalandi" : "IBAN Kopyala"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="min-w-[200px]">
                      <button
                        onClick={() => setShowBankForm((v) => !v)}
                        className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {showBankForm ? "Formu Gizle" : "Gonderdim"}
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
                        <label className="text-sm text-slate-400 font-semibold">Satin Alma Turu</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setBankPurchaseType("plan")}
                            className={`flex-1 py-2 rounded-lg font-bold ${
                              bankPurchaseType === "plan" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-200"
                            }`}
                          >
                            Plan
                          </button>
                          <button
                            onClick={() => setBankPurchaseType("credits")}
                            className={`flex-1 py-2 rounded-lg font-bold ${
                              bankPurchaseType === "credits" ? "bg-indigo-600 text-white" : "bg-slate-700 text-slate-200"
                            }`}
                          >
                            Kredi
                          </button>
                        </div>
                      </div>

                  {bankPurchaseType === "plan" ? (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400 font-semibold">Plan Sec</label>
                      <select
                        value={bankPlanId}
                        onChange={(e) => setBankPlanId(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                      >
                        <option value="">Plan seciniz</option>
                        {plans.filter((p) => p.id !== "free").map((p) => (
                          <option key={p.id} value={p.id}>
                            {getPlanName(p.name)} - {p.price} {p.currency || "TRY"}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm text-slate-400 font-semibold">Kredi Miktari</label>
                      <input
                        type="number"
                        min={1}
                        value={bankCredits}
                        onChange={(e) => setBankCredits(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        placeholder="Orn: 200"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm text-slate-400 font-semibold">Odeme Tutari (TRY)</label>
                    <input
                      type="number"
                      min={1}
                      value={bankAmount}
                      onChange={(e) => setBankAmount(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                      placeholder="Orn: 2999"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm text-slate-400 font-semibold">Aciklama (Opsiyonel)</label>
                    <textarea
                      value={bankNote}
                      onChange={(e) => setBankNote(e.target.value)}
                      className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 min-h-[110px]"
                      placeholder="Plan, islem notu, tarih vb."
                    />
                  </div>

                      <div className="md:col-span-2">
                        <button
                          onClick={handleBankRequest}
                          disabled={bankSubmitting}
                          className="w-full py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
                        >
                          {bankSubmitting ? "Gonderiliyor..." : "GONDER"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-black text-white">Havale / EFT Bilgileri</h2>
                  <p className="text-slate-400 text-sm">
                    Havale/EFT bilgilerini gormek icin kayit olmaniz gerekir. Kayit olmadan iletisime gecin.
                  </p>
                  <button
                    onClick={() => setGuestOpen((v) => !v)}
                    className="px-6 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Iletisim
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
                        <label className="text-sm text-slate-400 font-semibold">Ad Soyad</label>
                        <input
                          value={guestForm.name}
                          onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">E-posta</label>
                        <input
                          value={guestForm.email}
                          onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">Telefon</label>
                        <input
                          value={guestForm.phone}
                          onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-semibold">Istenen Paket/Kredi</label>
                        <input
                          value={guestForm.desired}
                          onChange={(e) => setGuestForm({ ...guestForm, desired: e.target.value })}
                          className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-200"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm text-slate-400 font-semibold">Mesaj</label>
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
                          {guestSubmitting ? "Gonderiliyor..." : "GONDER"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
