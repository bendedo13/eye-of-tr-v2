"use client";

import { useEffect, useState } from "react";
import { adminGetSiteSettings, adminSetSiteSetting } from "@/lib/adminApi";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey");
    if (!adminKey) {
      setSettings({});
      setLoading(false);
      return;
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const adminKey = localStorage.getItem("adminKey") || "";
      const data = await adminGetSiteSettings(adminKey);
      setSettings(data.settings || {});
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
      await adminSetSiteSetting(adminKey, key, value);
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
              value={settings["site.name"] || "FaceSeek"}
              onChange={(e) => saveSetting("site.name", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          
          <div>
            <label className="block text-slate-400 text-sm mb-2">Ücretsiz Kredi (Kayıtta)</label>
            <input
              type="number"
              value={settings["auth.free_credits"] ?? 1}
              onChange={(e) => saveSetting("auth.free_credits", parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2">Günlük Dork Limiti</label>
            <input
              type="number"
              value={settings["dork.daily_limit"] ?? 5}
              onChange={(e) => saveSetting("dork.daily_limit", parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-2">İletişim Email</label>
            <input
              type="email"
              value={settings["site.contact_email"] || ""}
              onChange={(e) => saveSetting("site.contact_email", e.target.value)}
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
            onClick={() => saveSetting("site.maintenance_mode", !settings["site.maintenance_mode"])}
            className={`px-4 py-2 rounded-xl font-medium transition ${
              settings["site.maintenance_mode"]
                ? "bg-red-600 text-white"
                : "bg-slate-700 text-slate-300"
            }`}
          >
            {settings["site.maintenance_mode"] ? "Aktif" : "Pasif"}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Ana Sayfa Metinleri (TR)</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Hero Badge</label>
            <input
              type="text"
              value={settings["home.tr.hero_badge"] || ""}
              onChange={(e) => saveSetting("home.tr.hero_badge", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Hero Title</label>
            <input
              type="text"
              value={settings["home.tr.hero_title"] || ""}
              onChange={(e) => saveSetting("home.tr.hero_title", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Hero Subtitle</label>
            <textarea
              value={settings["home.tr.hero_subtitle"] || ""}
              onChange={(e) => saveSetting("home.tr.hero_subtitle", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white min-h-[90px]"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Privacy Badge</label>
            <input
              type="text"
              value={settings["home.tr.privacy_badge"] || ""}
              onChange={(e) => saveSetting("home.tr.privacy_badge", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-sm mb-2">CTA Title (Part 1)</label>
              <input
                type="text"
                value={settings["home.tr.cta_title_part1"] || ""}
                onChange={(e) => saveSetting("home.tr.cta_title_part1", e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">CTA Title (Part 2)</label>
              <input
                type="text"
                value={settings["home.tr.cta_title_part2"] || ""}
                onChange={(e) => saveSetting("home.tr.cta_title_part2", e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">CTA Description</label>
            <textarea
              value={settings["home.tr.cta_description"] || ""}
              onChange={(e) => saveSetting("home.tr.cta_description", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white min-h-[90px]"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">CTA Button</label>
            <input
              type="text"
              value={settings["home.tr.cta_button"] || ""}
              onChange={(e) => saveSetting("home.tr.cta_button", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">Ana Sayfa Metinleri (EN)</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">Hero Badge</label>
            <input
              type="text"
              value={settings["home.en.hero_badge"] || ""}
              onChange={(e) => saveSetting("home.en.hero_badge", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Hero Title</label>
            <input
              type="text"
              value={settings["home.en.hero_title"] || ""}
              onChange={(e) => saveSetting("home.en.hero_title", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Hero Subtitle</label>
            <textarea
              value={settings["home.en.hero_subtitle"] || ""}
              onChange={(e) => saveSetting("home.en.hero_subtitle", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white min-h-[90px]"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">Privacy Badge</label>
            <input
              type="text"
              value={settings["home.en.privacy_badge"] || ""}
              onChange={(e) => saveSetting("home.en.privacy_badge", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-sm mb-2">CTA Title (Part 1)</label>
              <input
                type="text"
                value={settings["home.en.cta_title_part1"] || ""}
                onChange={(e) => saveSetting("home.en.cta_title_part1", e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">CTA Title (Part 2)</label>
              <input
                type="text"
                value={settings["home.en.cta_title_part2"] || ""}
                onChange={(e) => saveSetting("home.en.cta_title_part2", e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">CTA Description</label>
            <textarea
              value={settings["home.en.cta_description"] || ""}
              onChange={(e) => saveSetting("home.en.cta_description", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white min-h-[90px]"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">CTA Button</label>
            <input
              type="text"
              value={settings["home.en.cta_button"] || ""}
              onChange={(e) => saveSetting("home.en.cta_button", e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
            />
          </div>
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
