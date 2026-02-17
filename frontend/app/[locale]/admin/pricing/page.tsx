"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { toast } from "@/lib/toast";
import { DollarSign, Edit2, RotateCcw, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface PricingPlan {
  plan_id: string;
  name: string;
  price_try: number;
  price_usd: number;
  is_override: boolean;
  credits?: number;
  search_normal?: number;
  search_detailed?: number;
  search_location?: number;
}

export default function AdminPricingPage() {
  const router = useRouter();
  const locale = useLocale();
  const [adminKey, setAdminKey] = useState("");
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price_try: 0, price_usd: 0 });

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      const parsed = JSON.parse(stored);
      setAdminKey(parsed.key);
      loadPricing(parsed.key);
    } else {
      router.push(`/${locale}/admin/login`);
    }
  }, [locale, router]);

  const loadPricing = async (key: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing`, {
        headers: { "X-Admin-Key": key },
      });
      if (!res.ok) throw new Error("Failed to load pricing");
      const data = await res.json();
      setPlans(data.plans);
    } catch (error) {
      console.error(error);
      toast.error("Fiyatlandırma yüklenemedi");
    }
  };

  const startEdit = (plan: PricingPlan) => {
    setEditingPlan(plan.plan_id);
    setEditForm({ price_try: plan.price_try, price_usd: plan.price_usd });
  };

  const cancelEdit = () => {
    setEditingPlan(null);
    setEditForm({ price_try: 0, price_usd: 0 });
  };

  const savePricing = async (planId: string) => {
    if (editForm.price_try <= 0 || editForm.price_usd <= 0) {
      toast.error("Fiyatlar pozitif olmalıdır");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing/${planId}`, {
        method: "PUT",
        headers: {
          "X-Admin-Key": adminKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update pricing");
      
      toast.success("Fiyatlandırma güncellendi");
      setEditingPlan(null);
      loadPricing(adminKey);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPricing = async (planId: string) => {
    if (!confirm("Bu planı varsayılan fiyatlara sıfırlamak istediğinizden emin misiniz?")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/pricing/${planId}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminKey },
      });

      if (!res.ok) throw new Error("Failed to reset pricing");
      
      toast.success("Fiyatlandırma sıfırlandı");
      loadPricing(adminKey);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          Fiyatlandırma Yönetimi
        </h1>
        <p className="text-zinc-400 text-sm">
          Abonelik ve kredi paketlerinin fiyatlarını yönetin.
        </p>
      </div>

      <GlassCard className="p-6 bg-black/40 border-white/5">
        <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 flex items-center gap-2">
          <DollarSign size={20} className="text-primary" /> Fiyat Planları
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Plan
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  TRY Fiyat
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  USD Fiyat
                </th>
                <th className="text-left py-3 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Durum
                </th>
                <th className="text-right py-3 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.plan_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4">
                    <div className="text-white font-bold text-sm">{plan.name}</div>
                    <div className="text-zinc-500 text-xs">{plan.plan_id}</div>
                  </td>
                  <td className="py-4 px-4">
                    {editingPlan === plan.plan_id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field w-32 h-9 text-sm"
                        value={editForm.price_try}
                        onChange={(e) => setEditForm({ ...editForm, price_try: parseFloat(e.target.value) })}
                      />
                    ) : (
                      <span className="text-white font-mono">{plan.price_try.toFixed(2)} ₺</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {editingPlan === plan.plan_id ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field w-32 h-9 text-sm"
                        value={editForm.price_usd}
                        onChange={(e) => setEditForm({ ...editForm, price_usd: parseFloat(e.target.value) })}
                      />
                    ) : (
                      <span className="text-white font-mono">${plan.price_usd.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {plan.is_override ? (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-black uppercase">
                        Özel
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-white/5 text-zinc-400 rounded text-[9px] font-black uppercase">
                        Varsayılan
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {editingPlan === plan.plan_id ? (
                        <>
                          <button
                            onClick={() => savePricing(plan.plan_id)}
                            disabled={loading}
                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                            title="Kaydet"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                            title="İptal"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(plan)}
                            disabled={loading}
                            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                            title="Düzenle"
                          >
                            <Edit2 size={16} />
                          </button>
                          {plan.is_override && (
                            <button
                              onClick={() => resetPricing(plan.plan_id)}
                              disabled={loading}
                              className="p-2 bg-white/5 text-zinc-400 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                              title="Sıfırla"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12 text-zinc-600 text-sm">
            Fiyat planları yükleniyor...
          </div>
        )}
      </GlassCard>
    </div>
  );
}
