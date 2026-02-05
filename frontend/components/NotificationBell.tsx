"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useLocale } from "next-intl";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  action_link?: string;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locale = useLocale();

  // Poll for unread count
  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      try {
        const res = await api.get("/api/notifications/unread-count");
        setUnreadCount(res.data.count);
      } catch (err) {
        console.error("Failed to fetch notification count", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000); // Poll every minute

    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/notifications/?limit=5");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-zinc-500 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-[#1e293b] bg-[#1e293b]/50">
            <h3 className="text-sm font-bold text-white">Bildirimler</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] text-[#00d9ff] hover:underline"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-zinc-500 text-xs">Yükleniyor...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-xs">Bildirim yok</div>
            ) : (
              <div className="divide-y divide-[#1e293b]">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 hover:bg-[#1e293b]/30 transition-colors ${!notif.is_read ? 'bg-[#00d9ff]/5' : ''}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h4 className={`text-xs font-semibold ${!notif.is_read ? 'text-white' : 'text-zinc-400'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-zinc-600">
                            {new Date(notif.created_at).toLocaleDateString(locale)}
                          </span>
                          {notif.action_link && (
                            <Link 
                              href={notif.action_link}
                              className="text-[9px] text-[#00d9ff] hover:underline"
                              onClick={() => setIsOpen(false)}
                            >
                              Görüntüle
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notif.is_read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-zinc-500 hover:text-[#00d9ff]"
                          title="Okundu işaretle"
                        >
                          <div className="h-2 w-2 rounded-full bg-[#00d9ff]"></div>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-[#1e293b] bg-[#1e293b]/30 text-center">
            <Link 
              href={`/${locale}/dashboard/notifications`} 
              className="text-[10px] text-zinc-400 hover:text-white transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Tüm Bildirimleri Gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
