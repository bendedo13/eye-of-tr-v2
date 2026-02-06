"use client";

import { useState, useEffect } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  Paperclip, 
  User, 
  Shield,
  Clock,
  CheckCircle,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface ChatMessage {
  id: string;
  content: string;
  user_id: number;
  username: string;
  is_admin: boolean;
  timestamp: string;
  attachments?: string[];
}

export default function LiveSupportWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [room, setRoom] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || !isOpen) return;

    // Simple WebSocket connection for demo
    const token = localStorage.getItem("token");
    const wsUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http', 'ws')}/ws/support`;
    
    try {
      const websocket = new WebSocket(wsUrl);
      setWs(websocket);

      websocket.onopen = () => {
        setIsConnected(true);
        const userRoom = `user_${user.id}`;
        setRoom(userRoom);
        
        // Send join message
        websocket.send(JSON.stringify({
          type: 'join',
          room: userRoom,
          user_id: user.id,
          token: token
        }));
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'message') {
            setMessages(prev => [...prev, data.message]);
          } else if (data.type === 'typing') {
            setIsTyping(data.typing);
            setTypingUser(data.username);
          } else if (data.type === 'history') {
            setMessages(data.messages);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      websocket.onclose = () => {
        setIsConnected(false);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      // Fallback to mock messages for demo
      setMessages([
        {
          id: '1',
          content: 'Merhaba! Size nasıl yardımcı olabilirim?',
          user_id: 0,
          username: 'Destek Ekibi',
          is_admin: true,
          timestamp: new Date().toISOString()
        }
      ]);
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user, isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !ws || !isConnected || !user) return;

    const message = {
      type: 'message',
      room: room,
      content: inputMessage.trim(),
      user_id: user.id,
      username: user.username || user.email
    };

    ws.send(JSON.stringify(message));
    setInputMessage("");
  };

  const handleTyping = () => {
    if (!ws || !isConnected || !user) return;
    
    ws.send(JSON.stringify({
      type: 'typing',
      room: room,
      typing: inputMessage.length > 0,
      username: user.username || user.email
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !ws || !user) return;

    setUploading(true);
    
    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Send message with file attachment
      const message = {
        type: 'message',
        room: room,
        content: `📎 ${file.name} yüklendi`,
        user_id: user.id,
        username: user.username || user.email,
        attachments: [uploadRes.data.path]
      };

      ws.send(JSON.stringify(message));
      
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div>
                <h3 className="text-white font-semibold text-sm">{isConnected ? 'Canlı Destek' : 'Destek (Çevrimdışı)'}</h3>
                <p className="text-xs text-zinc-400">
                  {isConnected ? "Çevrimiçi" : "Bağlanıyor..."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-8">
                <User size={32} className="mx-auto mb-2 opacity-50" />
                <p>Merhaba! Size nasıl yardımcı olabilirim?</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.is_admin ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.is_admin
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-primary text-white'
                  }`}
                >
                  <p>{message.content}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs opacity-70">
                      <FileText size={12} />
                      <span>Dosya eklendi</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                    <Clock size={10} />
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-white border border-white/20 px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs">{typingUser} yazıyor...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className={`text-zinc-400 hover:text-white cursor-pointer ${uploading ? 'opacity-50' : ''}`}
              >
                <Paperclip size={18} />
              </label>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder="Mesajınızı yazın..."
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary/50"
                disabled={!isConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || !isConnected}
                className="bg-primary hover:bg-primary/90 text-white p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}