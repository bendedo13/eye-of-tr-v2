"use client";

import { useEffect, useState } from "react";
import { adminGetSiteSettings, adminSetSiteSetting } from "@/lib/adminApi";
import { getPricingPlans } from "@/lib/api";

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: "",
    currency: "TRY",
    credits: "",
    recommended: false,
    variant_id: "",
    features: "",
  });

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (!adminKey) {
      window.location.href = "/admin/login";
      return;
    }
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const settings = await adminGetSiteSettings(adminKey);
      if (settings.settings && settings.settings["pricing.plans"]) {
        setPlans(settings.settings["pricing.plans"]);
      } else {
        const defaults = await getPricingPlans();
        setPlans(defaults || []);
      }
    } catch (error) {
      console.error("Plans fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        currency: (formData.currency || "TRY").trim(),
        credits: parseInt(formData.credits),
        features: formData.features
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean),
        recommended: !!formData.recommended,
        ...(formData.variant_id.trim() ? { variant_id: formData.variant_id.trim() } : {}),
      };
      const adminKey = localStorage.getItem("adminKey") || "";

      let next = [...plans];
      if (editingPlan?.__index != null) {
        next[editingPlan.__index] = payload;
      } else {
        next = [payload, ...next];
      }
      await adminSetSiteSetting(adminKey, "pricing.plans", next);
      setPlans(next);
      setEditingPlan(null);
      setFormData({ id: "", name: "", price: "", currency: "TRY", credits: "", recommended: false, variant_id: "", features: "" });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (idx: number) => {
    if (!confirm("Bu planı silmek istediğinize emin misiniz?")) return;
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const next = plans.filter((_, i) => i !== idx);
      await adminSetSiteSetting(adminKey, "pricing.plans", next);
      setPlans(next);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const openEdit = (plan?: any, index?: number) => {
    if (plan) {
      setFormData({
        id: plan.id || "",
        name: plan.name || "",
        price: plan.price?.toString() || "",
        currency: plan.currency || "TRY",
        credits: plan.credits?.toString() || "",
        recommended: !!plan.recommended,
        variant_id: plan.variant_id || "",
        features: (plan.features || []).join("\n"),
      });
      setEditingPlan({ ...plan, __index: index });
    } else {
      setFormData({ id: "", name: "", price: "", currency: "TRY", credits: "", recommended: false, variant_id: "", features: "" });
      setEditingPlan({});
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Fiyatlandırma</h1>
        <button onClick={() => openEdit()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2">
          <span>➕</span> Yeni Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, idx) => (
          <div key={`${plan.id}-${idx}`} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(plan, idx)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">✏️</button>
                <button onClick={() => handleDelete(idx)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">🗑️</button>
              </div>
            </div>
            <div className="text-xs text-slate-400 mb-2">{plan.id}</div>
            <div className="text-3xl font-bold text-indigo-400 mb-2">{plan.price} {plan.currency || "TRY"}</div>
            <div className="text-slate-400 mb-4">{plan.credits} Kredi</div>
            <ul className="space-y-2">
              {(plan.features || []).map((f: string, i: number) => (
                <li key={i} className="text-slate-300 text-sm flex items-center gap-2">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">{editingPlan.id ? "Plan Düzenle" : "Yeni Plan"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Plan ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                  placeholder="premium_monthly"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Plan Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                  placeholder="Basic"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Fiyat</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                  placeholder="9.99"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Para Birimi</label>
                  <input
                    type="text"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                    placeholder="TRY"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-slate-300 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.recommended}
                      onChange={(e) => setFormData({ ...formData, recommended: e.target.checked })}
                    />
                    Önerilen
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Kredi</label>
                <input
                  type="number"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">LemonSqueezy Variant ID (opsiyonel)</label>
                <input
                  type="text"
                  value={formData.variant_id}
                  onChange={(e) => setFormData({ ...formData, variant_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                  placeholder="1272158"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Özellikler (her satıra bir tane)</label>
                <textarea
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white h-32"
                  placeholder="50 Arama Kredisi&#10;Temel Destek&#10;..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingPlan(null)} className="px-4 py-2 text-slate-400 hover:text-white">İptal</button>
              <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
