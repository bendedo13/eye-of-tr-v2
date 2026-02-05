"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/toast";
import { adminCreateNotification, adminListNotifications } from "@/lib/adminApi";
import { Send, Image, Video, Bell, Clock, Users, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "text",
    media_url: "",
    target_audience: "all",
  });

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (stored) {
      const parsed = JSON.parse(stored);
      setAdminKey(parsed.key);
      loadNotifications(parsed.key);
    } else {
      router.push("/tr/admin/login");
    }
  }, []);

  const loadNotifications = async (key: string) => {
    try {
      const res = await adminListNotifications(key);
      setNotifications(res.items);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error("Başlık ve mesaj zorunludur");

    setLoading(true);
    try {
      await adminCreateNotification(adminKey, form);
      toast.success("Bildirim başarıyla gönderildi");
      setForm({ title: "", message: "", type: "text", media_url: "", target_audience: "all" });
      loadNotifications(adminKey);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Bildirim Merkezi</h1>
        <p className="text-zinc-400 text-sm">Kullanıcılara anlık bildirimler gönderin ve yönetin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <GlassCard className="p-6 bg-black/40 border-white/5">
          <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 flex items-center gap-2">
            <Send size={20} className="text-primary" /> Yeni Bildirim
          </h2>
          
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Başlık</label>
                <input
                  className="input-field w-full h-10 text-sm"
                  placeholder="Örn: Sistem Bakımı"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hedef Kitle</label>
                <select
                  className="input-field w-full h-10 text-sm bg-black/40"
                  value={form.target_audience}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                >
                  <option value="all">Tüm Kullanıcılar</option>
                  <option value="premium">Premium Üyeler</option>
                  <option value="free">Ücretsiz Üyeler</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Mesaj İçeriği</label>
              <textarea
                className="input-field w-full h-32 text-sm py-3"
                placeholder="Bildirim detaylarını buraya yazın..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Medya (Opsiyonel)</label>
              <div className="flex gap-2 mb-2">
                {["text", "image", "video"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                      form.type === t ? "bg-primary text-white" : "bg-white/5 text-zinc-500 hover:bg-white/10"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {form.type !== "text" && (
                <input
                  className="input-field w-full h-10 text-sm"
                  placeholder={`${form.type === "image" ? "Görsel" : "Video"} URL'i girin`}
                  value={form.media_url}
                  onChange={(e) => setForm({ ...form, media_url: e.target.value })}
                />
              )}
            </div>

            <Button type="submit" className="w-full h-12 mt-4" disabled={loading}>
              {loading ? "GÖNDERİLİYOR..." : "BİLDİRİMİ GÖNDER"}
            </Button>
          </form>
        </GlassCard>

        {/* History & Preview */}
        <div className="space-y-6">
          <GlassCard className="p-6 bg-black/40 border-white/5">
             <h2 className="text-lg font-black text-white uppercase tracking-wide mb-6 flex items-center gap-2">
              <Bell size={20} className="text-primary" /> Önizleme
            </h2>
            <div className="bg-zinc-900 rounded-xl p-4 border border-white/10 relative overflow-hidden group">
               <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
               <h4 className="font-bold text-white mb-1">{form.title || "Bildirim Başlığı"}</h4>
               <p className="text-zinc-400 text-xs mb-3">{form.message || "Mesaj içeriği burada görünecek..."}</p>
               {form.type === "image" && form.media_url && (
                 <img src={form.media_url} className="w-full h-32 object-cover rounded-lg mt-2 border border-white/10" alt="Preview" />
               )}
               {form.type === "video" && form.media_url && (
                 <div className="w-full h-32 bg-black rounded-lg mt-2 flex items-center justify-center border border-white/10">
                    <Video size={24} className="text-zinc-500" />
                 </div>
               )}
            </div>
          </GlassCard>

          <GlassCard className="p-6 bg-black/40 border-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
            <h2 className="text-lg font-black text-white uppercase tracking-wide mb-4 flex items-center gap-2">
              <Clock size={20} className="text-primary" /> Gönderim Geçmişi
            </h2>
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-zinc-600 text-xs">Henüz bildirim gönderilmedi.</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-white font-bold text-sm">{n.title}</span>
                      <span className="text-[10px] text-zinc-500">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-zinc-400 text-xs line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-black uppercase">{n.type}</span>
                       <span className="px-2 py-0.5 bg-white/5 text-zinc-400 rounded text-[9px] font-black uppercase flex items-center gap-1">
                         <Users size={8} /> {n.target_audience}
                       </span>
                       <span className="ml-auto text-emerald-500 text-[9px] flex items-center gap-1">
                         <CheckCircle size={10} /> İLETİLDİ
                       </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
