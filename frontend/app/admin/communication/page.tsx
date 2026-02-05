"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Mail, 
  Send, 
  Plus, 
  Search, 
  Check, 
  X, 
  Loader2, 
  FileText,
  Clock
} from "lucide-react";
import { 
  adminListNotifications, 
  adminCreateNotification, 
  adminListEmailLogs, 
  adminSendEmail,
  adminListEmailTemplates
} from "@/lib/adminApi";
import { toast } from "@/lib/toast";

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<"notifications" | "emails">("notifications");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [adminKey, setAdminKey] = useState("");
  
  // Forms
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  // Notif Form
  const [notifForm, setNotifForm] = useState({
    title: "",
    message: "",
    type: "info",
    user_id: "",
    is_global: true
  });

  // Email Form
  const [emailForm, setEmailForm] = useState({
    to_email: "",
    subject: "",
    content_html: "",
    template_name: ""
  });
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const key = localStorage.getItem("adminKey");
    if (key) setAdminKey(key);
  }, []);

  useEffect(() => {
    if (adminKey) {
      loadData();
      if (activeTab === "emails") {
        loadTemplates();
      }
    }
  }, [adminKey, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "notifications") {
        const res = await adminListNotifications(adminKey, { limit: 20 });
        setData(res.items || []);
      } else {
        const res = await adminListEmailLogs(adminKey, { limit: 20 });
        setData(res.items || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await adminListEmailTemplates(adminKey);
      setTemplates(res || []);
    } catch (err) {
      console.error("Templates error", err);
    }
  };

  const handleSendNotification = async () => {
    try {
      const payload: any = {
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
      };
      
      if (!notifForm.is_global && notifForm.user_id) {
        payload.user_id = parseInt(notifForm.user_id);
      }

      await adminCreateNotification(adminKey, payload);
      toast.success("Bildirim gönderildi");
      setIsNotifModalOpen(false);
      loadData();
      setNotifForm({ title: "", message: "", type: "info", user_id: "", is_global: true });
    } catch (err) {
      toast.error("Bildirim gönderilemedi");
    }
  };

  const handleSendEmail = async () => {
    try {
      await adminSendEmail(adminKey, emailForm);
      toast.success("E-posta kuyruğa eklendi");
      setIsEmailModalOpen(false);
      loadData();
      setEmailForm({ to_email: "", subject: "", content_html: "", template_name: "" });
    } catch (err) {
      toast.error("E-posta gönderilemedi");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">İletişim Yönetimi</h1>
        <div className="flex bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "notifications" 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Bell size={16} />
            Bildirimler
          </button>
          <button
            onClick={() => setActiveTab("emails")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "emails" 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Mail size={16} />
            E-Posta
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Ara..." 
            className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary/50 focus:outline-none w-64"
          />
        </div>
        <button
          onClick={() => activeTab === "notifications" ? setIsNotifModalOpen(true) : setIsEmailModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          {activeTab === "notifications" ? <Plus size={16} /> : <Send size={16} />}
          {activeTab === "notifications" ? "Yeni Bildirim" : "E-Posta Gönder"}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  {activeTab === "notifications" ? (
                    <>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Başlık</th>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Mesaj</th>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Tip</th>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Hedef</th>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Tarih</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Alıcı</th>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Konu</th>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Durum</th>
                      <th className="p-4 text-xs font-bold text-zinc-400 uppercase">Tarih</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">
                      Kayıt bulunamadı
                    </td>
                  </tr>
                ) : (
                  data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      {activeTab === "notifications" ? (
                        <>
                          <td className="p-4 text-sm font-medium text-white">{item.title}</td>
                          <td className="p-4 text-sm text-zinc-400 max-w-xs truncate">{item.message}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              item.type === 'error' ? 'bg-red-500/20 text-red-500' : 
                              item.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 
                              'bg-blue-500/20 text-blue-500'
                            }`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-zinc-400">
                            {item.is_global ? "Global" : `User #${item.user_id}`}
                          </td>
                          <td className="p-4 text-xs text-zinc-500">
                            {new Date(item.created_at).toLocaleDateString("tr-TR")}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-sm font-medium text-white">{item.recipient}</td>
                          <td className="p-4 text-sm text-zinc-400">{item.subject}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'sent' ? 'bg-emerald-500/20 text-emerald-500' : 
                              item.status === 'failed' ? 'bg-red-500/20 text-red-500' : 
                              'bg-yellow-500/20 text-yellow-500'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-zinc-500">
                            {new Date(item.created_at).toLocaleString("tr-TR")}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Yeni Bildirim Gönder</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Başlık</label>
                <input 
                  type="text" 
                  value={notifForm.title}
                  onChange={e => setNotifForm({...notifForm, title: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Mesaj</label>
                <textarea 
                  value={notifForm.message}
                  onChange={e => setNotifForm({...notifForm, message: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Tip</label>
                  <select 
                    value={notifForm.type}
                    onChange={e => setNotifForm({...notifForm, type: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none"
                  >
                    <option value="info">Bilgi</option>
                    <option value="success">Başarı</option>
                    <option value="warning">Uyarı</option>
                    <option value="error">Hata</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Hedef</label>
                  <select 
                    value={notifForm.is_global ? "global" : "user"}
                    onChange={e => setNotifForm({...notifForm, is_global: e.target.value === "global"})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none"
                  >
                    <option value="global">Tüm Kullanıcılar</option>
                    <option value="user">Özel Kullanıcı</option>
                  </select>
                </div>
              </div>
              
              {!notifForm.is_global && (
                 <div>
                 <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Kullanıcı ID</label>
                 <input 
                   type="number" 
                   value={notifForm.user_id}
                   onChange={e => setNotifForm({...notifForm, user_id: e.target.value})}
                   className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none"
                   placeholder="Örn: 123"
                 />
               </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setIsNotifModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5"
              >
                İptal
              </button>
              <button 
                onClick={handleSendNotification}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">E-Posta Gönder</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Alıcı E-Posta</label>
                <input 
                  type="email" 
                  value={emailForm.to_email}
                  onChange={e => setEmailForm({...emailForm, to_email: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Konu</label>
                <input 
                  type="text" 
                  value={emailForm.subject}
                  onChange={e => setEmailForm({...emailForm, subject: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none"
                />
              </div>
              
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">Şablon (Opsiyonel)</label>
                <select 
                  value={emailForm.template_name}
                  onChange={e => setEmailForm({...emailForm, template_name: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none"
                >
                  <option value="">Şablon Seçiniz...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {!emailForm.template_name && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-bold block mb-1">İçerik (HTML)</label>
                  <textarea 
                    value={emailForm.content_html}
                    onChange={e => setEmailForm({...emailForm, content_html: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-primary/50 outline-none h-32 font-mono text-xs"
                    placeholder="<p>Merhaba...</p>"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5"
              >
                İptal
              </button>
              <button 
                onClick={handleSendEmail}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
