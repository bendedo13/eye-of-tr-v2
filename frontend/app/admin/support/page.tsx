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
  Send,
  Paperclip,
  User,
  Shield,
  AlertTriangle
} from "lucide-react";
import { adminListTickets, adminGetTicketDetails, adminReplyToTicket, adminUpdateTicketStatus } from "@/lib/adminApi";
import { toast } from "@/lib/toast";

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user_email: string;
  assigned_admin_id: number | null;
  created_at: string;
  updated_at: string | null;
  message_count: number;
}

interface SupportMessage {
  id: number;
  content: string;
  is_admin: boolean;
  created_at: string;
  attachments: string[] | null;
  user_email: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [adminKey, setAdminKey] = useState("");

  useEffect(() => {
    const key = localStorage.getItem("adminKey");
    if (key) setAdminKey(key);
  }, []);

  useEffect(() => {
    if (adminKey) {
      loadTickets();
    }
  }, [adminKey, statusFilter, priorityFilter]);

  useEffect(() => {
    if (selectedTicket && adminKey) {
      loadTicketDetails();
    }
  }, [selectedTicket, adminKey]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      
      const res = await adminListTickets(adminKey, params);
      setTickets(res || []);
    } catch (err) {
      console.error(err);
      toast.error("Destek talepleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async () => {
    if (!selectedTicket) return;
    
    try {
      const res = await adminGetTicketDetails(adminKey, selectedTicket.id);
      setMessages(res.messages || []);
    } catch (err) {
      console.error(err);
      toast.error("Mesajlar yüklenemedi");
    }
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      await adminReplyToTicket(adminKey, selectedTicket.id, {
        content: replyText.trim(),
        status: selectedTicket.status
      });
      
      toast.success("Yanıt gönderildi");
      setReplyText("");
      loadTicketDetails();
      loadTickets(); // Refresh ticket list
    } catch (err) {
      toast.error("Yanıt gönderilemedi");
    }
  };

  const handleStatusChange = async (ticketId: number, newStatus: string) => {
    try {
      await adminUpdateTicketStatus(adminKey, ticketId, newStatus);
      toast.success("Durum güncellendi");
      loadTickets();
      
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      toast.error("Durum güncellenemedi");
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

  if (!adminKey) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-500">Admin girişi gerekli</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white tracking-tight">Destek Talepleri</h1>
        
        <div className="flex items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none"
            >
              <option value="">Tüm Durumlar</option>
              <option value="open">Açık</option>
              <option value="in_progress">İşlemde</option>
              <option value="resolved">Çözüldü</option>
              <option value="closed">Kapalı</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary/50 outline-none"
            >
              <option value="">Tüm Öncelikler</option>
              <option value="urgent">Acil</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                <h2 className="text-white font-semibold">Talepler</h2>
                <span className="text-xs text-zinc-400">({tickets.length})</span>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-zinc-500 text-sm">Yükleniyor...</div>
              ) : tickets.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">Talep bulunamadı</div>
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
                      <span>{ticket.user_email}</span>
                      <span>{ticket.message_count} mesaj</span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(ticket.created_at).toLocaleDateString('tr-TR')}
                      </span>
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
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                      className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-primary/50 outline-none"
                    >
                      <option value="open">Açık</option>
                      <option value="in_progress">İşlemde</option>
                      <option value="resolved">Çözüldü</option>
                      <option value="closed">Kapalı</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <div className="flex items-center gap-1">
                    <User size={14} />
                    <span>{selectedTicket.user_email}</span>
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
                        <span>{message.user_email}</span>
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
                    placeholder="Yanıt yazın..."
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={handleReply}
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
                <p>Bir destek talebi seçin</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}