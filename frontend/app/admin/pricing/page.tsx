"use client";

import { useEffect, useState } from "react";

export default function AdminPricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", price: "", credits: "", features: "" });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/pricing");
      const data = await res.json();
      setPlans(data || []);
    } catch (error) {
      console.error("Plans fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: { tr: formData.name, en: formData.name },
        price: parseFloat(formData.price),
        credits: parseInt(formData.credits),
        features: { tr: formData.features.split("\n"), en: formData.features.split("\n") },
      };

      if (editingPlan?.id) {
        await fetch("/api/admin/pricing", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingPlan.id, ...payload }),
        });
      } else {
        await fetch("/api/admin/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      fetchPlans();
      setEditingPlan(null);
      setFormData({ name: "", price: "", credits: "", features: "" });
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu planı silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/admin/pricing?id=${id}`, { method: "DELETE" });
      fetchPlans();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const openEdit = (plan?: any) => {
    if (plan) {
      setFormData({
        name: plan.name?.tr || plan.name || "",
        price: plan.price?.toString() || "",
        credits: plan.credits?.toString() || "",
        features: (plan.features?.tr || plan.features || []).join("\n"),
      });
      setEditingPlan(plan);
    } else {
      setFormData({ name: "", price: "", credits: "", features: "" });
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
        {plans.map((plan) => (
          <div key={plan.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{plan.name?.tr || plan.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => openEdit(plan)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">✏️</button>
                <button onClick={() => handleDelete(plan.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg">🗑️</button>
              </div>
            </div>
            <div className="text-3xl font-bold text-indigo-400 mb-2">${plan.price}</div>
            <div className="text-slate-400 mb-4">{plan.credits} Kredi</div>
            <ul className="space-y-2">
              {(plan.features?.tr || plan.features || []).map((f: string, i: number) => (
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
                <label className="block text-slate-400 text-sm mb-1">Fiyat ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                  placeholder="9.99"
                />
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