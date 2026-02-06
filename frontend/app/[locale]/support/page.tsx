"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Paperclip,
  User,
  Shield,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useLocale } from "next-intl";

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  attachments: string[] | null;
}

interface SupportMessage {
  id: number;
  content: string;
  is_admin: boolean;
  created_at: string;
  attachments: string[] | null;
}

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const locale = useLocale();

  // Form state
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    category: "general",
    priority: "medium"
  });

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user, statusFilter]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages();
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      
      const res = await api.get("/api/support/tickets", { params });
      setTickets(res.data || []);
    } catch (err) {
      console.error(err);
      // Fallback to mock data for demo
      const mockTickets: SupportTicket[] = [
        {
          id: 1,
          title: "Hesabıma giriş yapamıyorum",
          description: "Şifremi unuttum, yeniden nasıl oluşturabilirim?",
          category: "account",
          priority: "high",
          status: "resolved",
          created_at: "2024-01-15T10:30:00Z",
          updated_at: "2024-01-15T11:00:00Z",
          attachments: null
        },
        {
          id: 2,
          title: "Ödeme sorunu",
          description: "Kredi kartımla ödeme yaparken hata alıyorum",
          category: "billing",
          priority: "urgent",
          status: "in_progress",
          created_at: "2024-01-14T15:20:00Z",
          updated_at: null,
          attachments: null
        }
      ];
      setTickets(mockTickets);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedTicket) return;
    
    try {
      const res = await api.get(`/api/support/tickets/${selectedTicket.id}/messages`);
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      // Fallback to mock messages for demo
      const mockMessages: SupportMessage[] = [
        {
          id: 1,
          content: selectedTicket.description,
          is_admin: false,
          created_at: selectedTicket.created_at,
          attachments: null
        },
        {
          id: 2,
          content: "Merhaba, sorununuzu incelemeye başladık. Kısa süre içinde size dönüş yapacağız.",
          is_admin: true,
          created_at: "2024-01-15T10:45:00Z",
          attachments: null
        }
      ];
      setMessages(mockMessages);
    }
  };

  const createTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) return;

    try {
      const formData = new FormData();
      formData.append("title", newTicket.title);
      formData.append("description", newTicket.description);
      formData.append("category", newTicket.category);
      formData.append("priority", newTicket.priority);

      await api.post("/api/support/tickets", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      // Reset form
      setNewTicket({ title: "", description: "", category: "general", priority: "medium" });
      setShowNewTicket(false);
      loadTickets();
    } catch (err) {
      console.error(err);
      // Fallback: add mock ticket
      const newId = Math.max(...tickets.map(t => t.id), 0) + 1;
      const mockNewTicket: SupportTicket = {
        id: newId,
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: null,
        attachments: null
      };
      setTickets([mockNewTicket, ...tickets]);
      setShowNewTicket(false);
    }
  };

  const addMessage = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      const messageData = {
        content: replyText.trim()
      };

      await api.post(`/api/support/tickets/${selectedTicket.id}/messages`, messageData);
      setReplyText("");
      loadMessages();
    } catch (err) {
      console.error(err);
      // Fallback: add mock message
      const newMessage: SupportMessage = {
        id: Math.max(...messages.map(m => m.id), 0) + 1,
        content: replyText.trim(),
        is_admin: false,
        created_at: new Date().toISOString(),
        attachments: null
      };
      setMessages([...messages, newMessage]);
      setReplyText("");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-500 bg-red-500/10";
      case "high": return "text-orange-500 bg-orange-500/10";
      case "medium": return "text-yellow-500 bg-yellow-500/10";
      case "low": return "text-green-500 bg-green-500/10";
      default: return "text-zinc-400 bg-zinc-500/10";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-blue-500 bg-blue-500/10";
      case "in_progress": return "text-yellow-500 bg-yellow-500/10";
      case "resolved": return "text-green-500 bg-green-500/10";
      case "closed": return "text-zinc-400 bg-zinc-500/10";
      default: return "text-zinc-400 bg-zinc-500/10";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "technical": return <Shield size={16} />;
      case "billing": return <AlertTriangle size={16} />;
      case "bug_report": return <XCircle size={16} />;
      default: return <MessageSquare size={16} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "technical": return "Teknik";
      case "billing": return "Ödeme";
      case "account": return "Hesap";
      case "bug_report": return "Hata Raporu";
      case "feature_request": return "Özellik Talebi";
      default: return "Genel";
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white/5 rounded-xl border border-white/10 p-8 text-center">
          <div className="text-zinc-400 mb-4">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-white mb-2">Destek Sistemi</h2>
            <p>Destek talebi oluşturmak için giriş yapmanız gerekiyor.</p>
          </div>
          <Link
            href={`/${locale}/login`}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Destek</h1>
        
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none"
          >
            <option value="">Tüm Talepler</option>
            <option value="open">Açık</option>
            <option value="in_progress">İşlemde</option>
            <option value="resolved">Çözüldü</option>
            <option value="closed">Kapalı</option>
          </select>
          
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={16} />
            Yeni Talep
          </button>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Yeni Destek Talebi</h2>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Kategori</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none"
                >
                  <option value="general">Genel</option>
                  <option value="technical">Teknik</option>
                  <option value="billing">Ödeme</option>
                  <option value="account">Hesap</option>
                  <option value="bug_report">Hata Raporu</option>
                  <option value="feature_request">Özellik Talebi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Öncelik</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary/50 outline-none"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Başlık</label>
              <input
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                placeholder="Sorununuzu özetleyin..."
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:border-primary/50 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Açıklama</label>
              <textarea
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Sorununuzu detaylı olarak açıklayın..."
                rows={4}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:border-primary/50 outline-none resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowNewTicket(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={createTicket}
                disabled={!newTicket.title.trim() || !newTicket.description.trim()}
                className="bg-primary hover:bg-primary/90 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Talep Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                <h2 className="text-white font-semibold">Talepleriniz</h2>
                <span className="text-xs text-zinc-400">({tickets.length})</span>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-zinc-500 text-sm">Yükleniyor...</div>
              ) : tickets.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  Henüz destek talebiniz yok
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-primary/10 border-primary/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(ticket.category)}
                        <h3 className="text-white text-sm font-medium line-clamp-1">
                          {ticket.title}
                        </h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>{getCategoryLabel(ticket.category)}</span>
                      <span>
                        {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(ticket.status)}`}>
                        {ticket.status === 'open' ? 'Açık' : 
                         ticket.status === 'in_progress' ? 'İşlemde' :
                         ticket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                      </span>
                      <ChevronRight size={14} className="text-zinc-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ticket Details & Chat */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              {/* Ticket Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-white text-lg font-semibold mb-1">{selectedTicket.title}</h2>
                    <p className="text-zinc-400 text-sm">{selectedTicket.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status === 'open' ? 'Açık' : 
                       selectedTicket.status === 'in_progress' ? 'İşlemde' :
                       selectedTicket.status === 'resolved' ? 'Çözüldü' : 'Kapalı'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>Siz</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{new Date(selectedTicket.created_at).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 max-h-64 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_admin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.is_admin
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'bg-primary text-white'
                      }`}
                    >
                      <p className="text-sm mb-1">{message.content}</p>
                      <div className="flex items-center gap-2 text-xs opacity-70">
                        <span>{message.is_admin ? 'Destek Ekibi' : 'Siz'}</span>
                        <span>•</span>
                        <span>
                          {new Date(message.created_at).toLocaleString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="p-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={addMessage}
                    disabled={!replyText.trim()}
                    className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
              <div className="text-zinc-500">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Bir destek talebi seçin veya yeni bir talep oluşturun</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}