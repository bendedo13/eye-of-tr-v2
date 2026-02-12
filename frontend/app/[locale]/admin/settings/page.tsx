"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Settings, Save } from "lucide-react";
import { adminGetSiteSettings, adminSetSiteSetting } from "@/lib/adminApi";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminGetSiteSettings(adminKey);
      setSettings(data || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      for (const [key, value] of Object.entries(settings)) {
        await adminSetSiteSetting(adminKey, key, value);
      }
      alert("Ayarlar kaydedildi");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">SİSTEM <span className="text-zinc-700">AYARLARI</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Settings size={12} /> Sistem ayarlarını yönet
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <GlassCard className="p-6 space-y-6">
          <div>
            <label className="block text-white font-black uppercase text-sm mb-2">Site Adı</label>
            <input
              type="text"
              value={settings.site_name || ""}
              onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-white font-black uppercase text-sm mb-2">Site Açıklaması</label>
            <textarea
              value={settings.site_description || ""}
              onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
              className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50 h-32"
            />
          </div>
          <div>
            <label className="block text-white font-black uppercase text-sm mb-2">Bakım Modu</label>
            <select
              value={settings.maintenance_mode ? "true" : "false"}
              onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.value === "true" })}
              className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
            >
              <option value="false">Kapalı</option>
              <option value="true">Açık</option>
            </select>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
