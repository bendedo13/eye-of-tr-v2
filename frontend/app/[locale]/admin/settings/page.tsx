"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { adminChangePassword, adminGetSiteSettings, adminSetSiteSetting } from "@/lib/adminApi";
import { Settings, Lock, Shield, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: ""
  });

  const [settings, setSettings] = useState({
    maintenance_mode: false,
    registrations_open: true,
    require_email_verification: false
  });

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      const parsed = JSON.parse(stored);
      setAdminKey(parsed.key);
      loadSettings(parsed.key);
    } else {
      router.push("/tr/admin/login");
    }
  }, []);

  const loadSettings = async (key: string) => {
    try {
      const res = await adminGetSiteSettings(key);
      if (res.settings) setSettings(res.settings);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      return toast.error("Şifreler eşleşmiyor");
    }
    if (passwordForm.new.length < 8) {
      return toast.error("Şifre en az 8 karakter olmalıdır");
    }

    setLoading(true);
    try {
      await adminChangePassword(adminKey, passwordForm.new);
      toast.success("Yönetici şifresi güncellendi");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: string, currentVal: boolean) => {
    try {
      await adminSetSiteSetting(adminKey, key, !currentVal);
      setSettings(prev => ({ ...prev, [key]: !currentVal }));
      toast.success("Ayar güncellendi");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Sistem Ayarları</h1>
        <p className="text-zinc-400 text-sm">Platform genel ayarlarını ve güvenlik tercihlerini yapılandırın.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Settings */}
        <GlassCard className="p-8 bg-black/40 border-white/5">
          <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 flex items-center gap-2">
            <Lock size={20} className="text-primary" /> Güvenlik & Erişim
          </h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Yeni Şifre</label>
                <input
                  type="password"
                  className="input-field w-full h-12 text-sm"
                  placeholder="••••••••"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Şifre Tekrar</label>
                <input
                  type="password"
                  className="input-field w-full h-12 text-sm"
                  placeholder="••••••••"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
               <Shield size={16} className="text-rose-500 mt-1 shrink-0" />
               <div className="space-y-1">
                 <h4 className="text-rose-500 font-bold text-xs uppercase">Yüksek Yetkili Hesap</h4>
                 <p className="text-[10px] text-rose-300/80 leading-relaxed">
                   Şifrenizi değiştirdiğinizde, tüm aktif oturumlar sonlandırılabilir. Lütfen güçlü bir şifre seçtiğinizden emin olun.
                 </p>
               </div>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? "GÜNCELLENİYOR..." : "ŞİFREYİ GÜNCELLE"}
            </Button>
          </form>
        </GlassCard>

        {/* General Settings */}
        <GlassCard className="p-8 bg-black/40 border-white/5">
          <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 flex items-center gap-2">
            <Settings size={20} className="text-primary" /> Genel Konfigürasyon
          </h2>
          
          <div className="space-y-4">
             {/* Maintenance Mode */}
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                   <h4 className="text-white font-bold text-sm">Bakım Modu</h4>
                   <p className="text-zinc-500 text-[10px] mt-1">Siteyi ziyaretçilere kapatır, sadece adminler erişebilir.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.maintenance_mode} onChange={() => toggleSetting('maintenance_mode', settings.maintenance_mode)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
             </div>

             {/* Registration */}
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                   <h4 className="text-white font-bold text-sm">Yeni Kayıtlar</h4>
                   <p className="text-zinc-500 text-[10px] mt-1">Yeni kullanıcı kayıtlarını geçici olarak durdur.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.registrations_open} onChange={() => toggleSetting('registrations_open', settings.registrations_open)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
             </div>

             {/* Email Verification */}
             <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                   <h4 className="text-white font-bold text-sm">Email Doğrulama Zorunluluğu</h4>
                   <p className="text-zinc-500 text-[10px] mt-1">Kullanıcıların giriş yapmadan önce email onayı yapması gerekir.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.require_email_verification} onChange={() => toggleSetting('require_email_verification', settings.require_email_verification)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
             </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
