"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Ana Sayfa", icon: "🏠" },
  { href: "/search", label: "Arama", icon: "🔍" },
  { href: "/godork", label: "GoDork", icon: "🔎" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/pricing", label: "Fiyatlandırma", icon: "💎" },
];

export default function Navbar() {
  const { user, logout, mounted } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userCredits = (user as any)?.credits || 0;

  if (!mounted) {
    return (
      <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16"></div>
      </nav>
    );
  }

  return (
    <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">👁️</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">FaceSeek</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
                  <span className="text-yellow-400">💳</span>
                  <span className="text-white font-bold">{userCredits}</span>
                  <span className="text-xs text-slate-400">kredi</span>
                </div>

                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  </button>

                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="p-4 border-b border-slate-700">
                      <div className="text-white font-medium truncate">{user.email}</div>
                      <div className="text-slate-400 text-sm mt-1">{userCredits} Kredi</div>
                    </div>
                    <div className="p-2">
                      <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition">
                        <span>📊</span>
                        <span>Dashboard</span>
                      </Link>
                      <Link href="/pricing" className="flex items-center gap-3 px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition">
                        <span>💎</span>
                        <span>Kredi Al</span>
                      </Link>
                      <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
                        <span>🚪</span>
                        <span>Çıkış Yap</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-slate-300 hover:text-white transition">Giriş</Link>
                <Link href="/register" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition">Kayıt Ol</Link>
              </>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400 hover:text-white">
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                    pathname === link.href ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
            {user && (
              <div className="mt-4 pt-4 border-t border-slate-800 px-4">
                <div className="text-white font-bold">{userCredits} Kredi</div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}