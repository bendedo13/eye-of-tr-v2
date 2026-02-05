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
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import io from "socket.io-client";

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
  const [socket, setSocket] = useState<any>(null);
  const [room, setRoom] = useState<string>("");

  useEffect(() => {
    if (!user || !isOpen) return;

    // Initialize Socket.IO connection
    const token = localStorage.getItem("token");
    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL || "", {
      query: {
        token: token,
        type: "user"
      },
      transports: ["websocket", "polling"]
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      const userRoom = `user_${user.id}`;
      setRoom(userRoom);
      newSocket.emit("join_room", { room: userRoom, user_id: user.id });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("new_message", (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on("typing", (data: { username: string; typing: boolean }) => {
      setIsTyping(data.typing);
      setTypingUser(data.typing ? data.username : null);
    });

    newSocket.on("chat_history", (data: { messages: ChatMessage[] }) => {
      setMessages(data.messages);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !socket || !isConnected) return;

    socket.emit("send_message", {
      room: room,
      content: inputMessage.trim(),
      type: "text"
    });

    setInputMessage("");
  };

  const handleTyping = () => {
    if (!socket || !isConnected) return;
    
    socket.emit("typing_indicator", {
      room: room,
      typing: inputMessage.length > 0
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <h3 className="text-white font-semibold text-sm">Canlı Destek</h3>
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
              <button className="text-zinc-400 hover:text-white">
                <Paperclip size={18} />
              </button>
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