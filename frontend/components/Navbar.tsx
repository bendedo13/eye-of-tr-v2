"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, mounted, loading } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Ana Sayfa", icon: "🏠" },
    { href: "/search", label: "Arama", icon: "🔍", authRequired: true },
    { href: "/dashboard", label: "Dashboard", icon: "📊", authRequired: true },
    { href: "/pricing", label: "Fiyatlandırma", icon: "💎" },
    { href: "/about", label: "Hakkımızda", icon: "ℹ️" },
  ];

  const isActive = (path: string) => pathname === path;

  if (!mounted || loading) {
    return (
      <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-50 backdrop-blur-lg bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="h-8 w-32 bg-slate-700 rounded animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-50 backdrop-blur-lg bg-opacity-90 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-3xl">👁️</span>
            <span className="text-xl font-black text-white neon-text group-hover:text-indigo-400 transition-colors">
              Faceseek
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((link) => !link.authRequired || user)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive(link.href)
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="hidden lg:inline">{link.label}</span>
                </Link>
              ))}
          </div>

          {/* Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-yellow-400">💳</span>
                  <span className="text-white font-bold">{user.credits || 0}</span>
                  <span className="text-xs text-slate-400">kredi</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
                >
                  <span>🚪</span>
                  <span>Çıkış</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-white font-semibold hover:text-indigo-400 transition-colors"
                >
                  <span>🔐</span>
                  <span>Giriş</span>
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-lg transition-all shadow-lg"
                >
                  <span>🎁</span>
                  <span>Kayıt Ol</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            {mobileMenuOpen ? (
              <span className="text-2xl">✕</span>
            ) : (
              <span className="text-2xl">☰</span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)] animate-slide-up">
          <div className="px-4 py-4 space-y-2">
            {navLinks
              .filter((link) => !link.authRequired || user)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                    isActive(link.href)
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                      : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span className="text-xl">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}

            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-2xl">💳</span>
                  <div>
                    <div className="text-white font-bold">{user.credits || 0} Kredi</div>
                    <div className="text-xs text-slate-400">Kalan bakiye</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all"
                >
                  <span className="text-xl">🚪</span>
                  <span>Çıkış Yap</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                >
                  <span className="text-xl">🔐</span>
                  <span>Giriş Yap</span>
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-lg transition-all shadow-lg"
                >
                  <span className="text-xl">🎁</span>
                  <span>Kayıt Ol (1 Ücretsiz Kredi)</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
