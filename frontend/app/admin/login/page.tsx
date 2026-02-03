"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Mail, Key, Layout } from "lucide-react";
import { adminPing } from "@/lib/adminApi";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await adminPing(password);
      localStorage.setItem("admin", JSON.stringify({ email, name: "Admin" }));
      localStorage.setItem("adminKey", password);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--color-primary-glow)_0%,_transparent_70%)]">
      <div className="w-full max-w-[450px] animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-primary/20 border-2 border-primary/40 rounded-[32px] flex items-center justify-center text-primary shadow-2xl shadow-primary/20 mx-auto mb-6 transform hover:rotate-6 transition-transform">
            <ShieldCheck size={48} />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tight">KONTROL <span className="text-zinc-600">MERKEZİ</span></h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
            <Layout size={12} /> FaceSeek Administrative Protocol
          </p>
        </div>

        <GlassCard className="p-10 border-t-4 border-t-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]" hasScanline>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Mail size={12} /> YÖNETİCİ E-POSTA
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full h-14 bg-black/40 border-zinc-800"
                  placeholder="admin@faceseek.io"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 px-1">
                  <Key size={12} /> ERİŞİM ANAHTARI
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full h-14 bg-black/40 border-zinc-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full h-14 font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/20"
            >
              OTURUM AÇ
            </Button>
          </form>
        </GlassCard>

        <p className="mt-8 text-center text-zinc-700 text-[9px] font-bold uppercase tracking-[0.2em]">
          SECURED BY ENCRYPTED PROTOCOL-X9
        </p>
      </div>
    </div>
  );
}
