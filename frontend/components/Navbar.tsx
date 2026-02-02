"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  User,
  LogOut,
  BarChart3,
  Search,
  CreditCard,
  Sparkles,
  Zap,
  ShieldCheck
} from "lucide-react";
import { Button } from "./ui/Button";

const navLinks = [
  { href: "/", label: "OPERASYON", icon: <Zap size={16} /> },
  { href: "/search", label: "YÜZ ARAMA", icon: <Search size={16} /> },
  { href: "/godork", label: "GODORK", icon: <ShieldCheck size={16} /> },
  { href: "/pricing", label: "SERVİS TİER", icon: <CreditCard size={16} /> },
];

export default function Navbar() {
  const { user, logout, mounted } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userCredits = (user as any)?.credits || 0;

  if (!mounted) {
    return (
      <nav className="h-24 sticky top-0 z-[100] border-b border-transparent"></nav>
    );
  }

  return (
    <nav className={`h-24 sticky top-0 z-[100] transition-all duration-500 ${scrolled
        ? "bg-background/80 backdrop-blur-3xl border-b border-white/5 py-2"
        : "bg-transparent border-b border-white/0 py-4"
      }`}>
      <div className="max-w-7xl mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <div className="w-10 h-10 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/20">
              <ShieldCheck size={22} />
            </div>
            <span className="text-xl font-black text-white tracking-tighter uppercase">FACE<span className="text-zinc-600">SEEK</span></span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${isActive
                      ? "bg-white/5 text-primary"
                      : "text-zinc-500 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 bg-zinc-900 border border-white/5 rounded-2xl">
                  <Zap size={14} className="text-primary" />
                  <span className="text-xs font-black text-white">{userCredits} <span className="text-[10px] text-zinc-600 uppercase tracking-widest ml-1">Kredi</span></span>
                </div>

                <div className="relative group">
                  <button className="flex items-center gap-3 p-1 rounded-2xl hover:bg-white/5 transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  </button>

                  <div className="absolute right-0 top-full mt-4 w-64 glass-dark rounded-3xl border border-white/10 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 p-3">
                    <div className="p-4 border-b border-white/5">
                      <div className="text-white font-black text-xs truncate uppercase tracking-tight">{user.email}</div>
                      <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-2">
                        <Sparkles size={10} /> Account Lvl 1
                      </div>
                    </div>
                    <div className="p-2 space-y-1 mt-2">
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.15em]">
                        <BarChart3 size={16} /> DASHBOARD
                      </Link>
                      <Link href="/pricing" className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.15em]">
                        <CreditCard size={16} /> KREDİ YÜKLE
                      </Link>
                      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/5 rounded-2xl transition-all text-[10px] font-black uppercase tracking-[0.15em]">
                        <LogOut size={16} /> SİSTEMDEN ÇIK
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] px-4">Giriş</Link>
                <Button onClick={() => window.location.href = '/register'} className="h-12 px-6 text-[10px]">KAYIT OL</Button>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-3 bg-white/5 rounded-xl text-zinc-500 hover:text-white"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 glass-dark border-b border-white/5 animate-in slide-in-from-top-4 duration-300">
            <div className="p-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] ${pathname === link.href ? "bg-primary text-white" : "text-zinc-500 bg-white/5"
                    }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                  <Button onClick={() => window.location.href = '/login'} variant="outline" className="h-14">GİRİŞ YAP</Button>
                  <Button onClick={() => window.location.href = '/register'} className="h-14">KAYIT OL</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}