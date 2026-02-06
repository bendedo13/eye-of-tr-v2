"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Bell, Info, AlertTriangle, CheckCircle, AlertOctagon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error" | "system";
  media_url?: string;
  media_type?: "image" | "video";
}

export default function GlobalNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);
  const [canClose, setCanClose] = useState(false);
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/+$/, "");

  // Polling for notifications (Basit yöntem)
  useEffect(() => {
    if (!user || !token) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${apiBase}/notifications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Eğer yeni bildirim varsa ve şu an ekranda bir şey yoksa göster
          if (data.length > 0 && !activeNotif) {
            setNotifications(data);
            setActiveNotif(data[0]);
            playNotificationSound();
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30 saniyede bir kontrol et
    return () => clearInterval(interval);
  }, [user, token, activeNotif]);

  // Aktif bildirim değiştiğinde timer başlat
  useEffect(() => {
    if (activeNotif) {
      setCanClose(false);
      const timer = setTimeout(() => {
        setCanClose(true);
      }, 2000); // 2 saniye zorunlu bekleme
      return () => clearTimeout(timer);
    }
  }, [activeNotif]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/notification.mp3"); // public klasöründe olmalı
      audio.play().catch(e => console.log("Audio play failed (interaction required)", e));
    } catch (e) {
      console.log("Audio error", e);
    }
  };

  const closeNotification = async () => {
    if (!activeNotif || !canClose) return;

    // Backend'e okundu bilgisi gönder
    try {
      await fetch(`${apiBase}/notifications/${activeNotif.id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.error("Failed to mark read", e);
    }

    // Listeden çıkar ve bir sonrakine geç
    const remaining = notifications.slice(1);
    setNotifications(remaining);
    setActiveNotif(remaining.length > 0 ? remaining[0] : null);
  };

  if (!activeNotif) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertOctagon className="text-rose-500" />;
      case "warning": return <AlertTriangle className="text-amber-500" />;
      case "success": return <CheckCircle className="text-emerald-500" />;
      default: return <Info className="text-blue-500" />;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "error": return "border-rose-500/50 bg-rose-950/90";
      case "warning": return "border-amber-500/50 bg-amber-950/90";
      case "success": return "border-emerald-500/50 bg-emerald-950/90";
      default: return "border-blue-500/50 bg-slate-950/90";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-6 right-6 z-[9999] max-w-md w-full"
      >
        <div className={`backdrop-blur-xl border p-6 rounded-3xl shadow-2xl shadow-black/50 ${getTypeStyle(activeNotif.type)} text-white overflow-hidden relative`}>
          
          {/* Progress Bar for forced wait */}
          {!canClose && (
            <motion.div 
              initial={{ width: "100%" }} 
              animate={{ width: "0%" }} 
              transition={{ duration: 2, ease: "linear" }}
              className="absolute top-0 left-0 h-1 bg-white/30"
            />
          )}

          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/10 rounded-2xl shrink-0">
              {getTypeIcon(activeNotif.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black uppercase tracking-tight mb-1">{activeNotif.title}</h3>
              <p className="text-sm font-medium text-white/80 leading-relaxed mb-4">{activeNotif.message}</p>
              
              {activeNotif.media_url && (
                <div className="rounded-xl overflow-hidden mb-4 border border-white/10 bg-black/20">
                  {activeNotif.media_type === 'video' ? (
                    <video src={activeNotif.media_url} controls autoPlay muted loop className="w-full max-h-48 object-cover" />
                  ) : (
                    <img src={activeNotif.media_url} alt="Notification Media" className="w-full max-h-48 object-cover" />
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={closeNotification}
              disabled={!canClose}
              className={`p-2 rounded-full transition-all ${canClose ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
