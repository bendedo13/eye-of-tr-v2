"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { toast } from "@/lib/toast";
import { Edit2, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface PricingPlan {
  id: string;
  name: { tr: string; en: string };
  price_try: number;
  price_usd: number;
  credits: number;
  billing_period: "monthly" | "yearly" | "once";
  is_one_time?: boolean;
  recommended?: boolean;
  features: { tr: string[]; en: string[] };
  shopify_url?: string;
}

type PlanForm = {
  id: string;
  name_tr: string;
  name_en: string;
  price_try: string;
  price_usd: string;
  credits: string;
  billing_period: "monthly" | "yearly" | "once";
  is_one_time: boolean;
  recommended: boolean;
  features_tr: string;
  features_en: string;
  shopify_url: string;
};

const emptyForm: PlanForm = {
  id: "",
  name_tr: "",
  name_en: "",
  price_try: "",
  price_usd: "",
  credits: "",
  billing_period: "monthly",
  is_one_time: false,
  recommended: false,
  features_tr: "",
  features_en: "",
  shopify_url: "",
};

const toForm = (plan: PricingPlan): PlanForm => ({
  id: plan.id,
  name_tr: plan.name?.tr || "",
  name_en: plan.name?.en || "",
  price_try: String(plan.price_try ?? ""),
  price_usd: String(plan.price_usd ?? ""),
  credits: String(plan.credits ?? ""),
  billing_period: plan.billing_period || "monthly",
  is_one_time: !!plan.is_one_time,
  recommended: !!plan.recommended,
  features_tr: (plan.features?.tr || []).join("\n"),
  features_en: (plan.features?.en || []).join("\n"),
  shopify_url: plan.shopify_url || "",
});

const parseLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export default function AdminPricingPage() {
  const router = useRouter();
  const locale = useLocale();
  const [adminKey, setAdminKey] = useState("");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem("adminKey") || "";
    if (!key) {
      router.push(`/${locale}/admin/login`);
      return;
    }
    setAdminKey(key);
    loadPricing(key);
  }, [locale, router]);

  const loadPricing = async (key: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing`, {
        headers: { "X-Admin-Key": key },
      });
      if (!res.ok) throw new Error("Failed to load pricing");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error(error);
      toast.error("Fiyatlandırma yüklenemedi");
    }
  };

  const planIds = useMemo(() => new Set(plans.map((p) => p.id)), [plans]);

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (plan: PricingPlan) => {
    setIsCreating(false);
    setEditingId(plan.id);
    setForm(toForm(plan));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm);
  };

  const savePlan = async () => {
    const payload = {
      id: form.id.trim(),
      name: { tr: form.name_tr.trim(), en: form.name_en.trim() },
      price_try: Number(form.price_try),
      price_usd: Number(form.price_usd),
      credits: Number(form.credits),
      billing_period: form.billing_period,
      is_one_time: form.is_one_time,
      recommended: form.recommended,
      shopify_url: form.shopify_url.trim(),
      features: {
        tr: parseLines(form.features_tr),
        en: parseLines(form.features_en),
      },
    };

    if (!payload.id || !payload.name.tr || !payload.name.en) {
      toast.error("Plan ID ve isimler zorunludur");
      return;
    }
    if (isCreating && planIds.has(payload.id)) {
      toast.error("Bu plan ID zaten var");
      return;
    }
    if (Number.isNaN(payload.price_try) || Number.isNaN(payload.price_usd)) {
      toast.error("Fiyatlar sayısal olmalıdır");
      return;
    }
    if (Number.isNaN(payload.credits)) {
      toast.error("Kredi sayısı sayısal olmalıdır");
      return;
    }

    setLoading(true);
    try {
      const url = isCreating
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing/${payload.id}`;
      const method = isCreating ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: {
          "X-Admin-Key": adminKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save pricing plan");
      toast.success(isCreating ? "Plan oluşturuldu" : "Plan güncellendi");
      cancelEdit();
      loadPricing(adminKey);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm("Bu planı silmek istediğinizden emin misiniz?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing/${planId}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to delete plan");
      toast.success("Plan silindi");
      loadPricing(adminKey);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetDefaults = async () => {
    if (!confirm("Varsayılan planları geri yüklemek istediğinizden emin misiniz?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing/reset`, {
        method: "POST",
        headers: { "X-Admin-Key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to reset pricing");
      toast.success("Varsayılan planlar yüklendi");
      cancelEdit();
      loadPricing(adminKey);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
            Fiyatlandırma Yönetimi
          </h1>
          <p className="text-zinc-400 text-sm">
            Planları, özellikleri ve Shopify bağlantılarını yönetin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetDefaults}
            disabled={loading}
            className="px-4 py-2 bg-white/5 text-zinc-300 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={14} /> Varsayılanlar
          </button>
          <button
            onClick={startCreate}
            disabled={loading}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg text-xs font-black uppercase tracking-widest hover:bg-primary/30 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus size={14} /> Yeni Plan
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-6 bg-black/40 border-white/5">
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 rounded-2xl border border-white/5 bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-white font-black text-sm">{plan.name?.tr || plan.id}</div>
                    <div className="text-zinc-500 text-xs">{plan.id}</div>
                    <div className="text-zinc-400 text-xs mt-2">
                      ₺{plan.price_try} • ${plan.price_usd} • {plan.credits} kredi
                    </div>
                    <div className="text-zinc-500 text-[10px] mt-1 uppercase tracking-widest">
                      {plan.billing_period} {plan.is_one_time ? "• tek seferlik" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(plan)}
                      disabled={loading}
                      className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                      title="Düzenle"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      disabled={loading}
                      className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {plans.length === 0 && (
              <div className="text-center py-8 text-zinc-600 text-sm">
                Fiyat planları yükleniyor...
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6 bg-black/40 border-white/5">
          <div className="text-sm font-black text-white uppercase tracking-widest mb-6">
            {isCreating ? "Yeni Plan" : editingId ? "Planı Düzenle" : "Plan Seçin"}
          </div>
          {(isCreating || editingId) ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Plan ID</label>
                  <input
                    className="input-field w-full h-10 text-sm"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    disabled={!isCreating}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Periyot</label>
                  <select
                    className="input-field w-full h-10 text-sm bg-black/40"
                    value={form.billing_period}
                    onChange={(e) => setForm({ ...form, billing_period: e.target.value as PlanForm["billing_period"] })}
                  >
                    <option value="monthly">Aylık</option>
                    <option value="yearly">Yıllık</option>
                    <option value="once">Tek Seferlik</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Plan Adı (TR)</label>
                  <input
                    className="input-field w-full h-10 text-sm"
                    value={form.name_tr}
                    onChange={(e) => setForm({ ...form, name_tr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Plan Adı (EN)</label>
                  <input
                    className="input-field w-full h-10 text-sm"
                    value={form.name_en}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">TRY Fiyat</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field w-full h-10 text-sm"
                    value={form.price_try}
                    onChange={(e) => setForm({ ...form, price_try: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">USD Fiyat</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field w-full h-10 text-sm"
                    value={form.price_usd}
                    onChange={(e) => setForm({ ...form, price_usd: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kredi</label>
                  <input
                    type="number"
                    className="input-field w-full h-10 text-sm"
                    value={form.credits}
                    onChange={(e) => setForm({ ...form, credits: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={form.is_one_time}
                    onChange={(e) => setForm({ ...form, is_one_time: e.target.checked })}
                  />
                  Tek seferlik
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <input
                    type="checkbox"
                    checked={form.recommended}
                    onChange={(e) => setForm({ ...form, recommended: e.target.checked })}
                  />
                  Önerilen
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Shopify URL</label>
                <input
                  className="input-field w-full h-10 text-sm"
                  value={form.shopify_url}
                  onChange={(e) => setForm({ ...form, shopify_url: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Özellikler (TR)</label>
                  <textarea
                    className="input-field w-full h-28 text-sm py-3"
                    value={form.features_tr}
                    onChange={(e) => setForm({ ...form, features_tr: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Özellikler (EN)</label>
                  <textarea
                    className="input-field w-full h-28 text-sm py-3"
                    value={form.features_en}
                    onChange={(e) => setForm({ ...form, features_en: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-white/10 text-zinc-400 text-xs font-black uppercase tracking-widest"
                  disabled={loading}
                >
                  İptal
                </button>
                <button
                  onClick={savePlan}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  <Save size={14} /> Kaydet
                </button>
              </div>
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">
              Düzenlemek için listeden bir plan seçin ya da yeni plan oluşturun.
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
