"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (!adminKey) {
      window.location.href = "/admin/login";
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const res = await fetch("/api/admin/settings", { headers: { "x-admin-key": adminKey } });
      const data = await res.json();
      setSettings(data || {});
    } catch (error) {
      console.error("Settings fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ key, value }),
      });
      setSettings({ ...settings, [key]: value });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Ayarlar</h1>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Genel Ayarlar</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Site Adı</label>
            <input
              type="text"
              value={settings.siteName || "FaceSeek"}
              onChange={(e) => saveSetting("siteName", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-2">Ücretsiz Kredi (Kayıtta)</label>
            <input
              type="number"
              value={settings.freeCredits || 10}
              onChange={(e) => saveSetting("freeCredits", parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2">Günlük Dork Limiti</label>
            <input
              type="number"
              value={settings.dailyDorkLimit || 5}
              onChange={(e) => saveSetting("dailyDorkLimit", parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2">İletişim Email</label>
            <input
              type="email"
              value={settings.contactEmail || ""}
              onChange={(e) => saveSetting("contactEmail", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              placeholder="info@faceseek.com"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Bakım Modu</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-medium">Bakım Modu</div>
            <div className="text-slate-400 text-sm">Siteyi geçici olarak kapatır</div>
          </div>
          <button
            onClick={() => saveSetting("maintenanceMode", !settings.maintenanceMode)}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              settings.maintenanceMode
                ? "bg-red-600 text-white"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {settings.maintenanceMode ? "Aktif" : "Pasif"}
          </button>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-xl">
          Kaydediliyor...
        </div>
      )}
    </div>
  );
}
