"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from 'next-intl';
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
  ShieldCheck,
  Globe
} from "lucide-react";
import { Button } from "./ui/Button";

export default function Navbar() {
  const { user, logout, mounted } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('nav');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navLinks = [
    { href: `/${locale}`, label: t('home'), icon: <Zap size={16} /> },
    { href: `/${locale}/search`, label: t('search'), icon: <Search size={16} /> },
    { href: `/${locale}/pricing`, label: t('pricing'), icon: <CreditCard size={16} /> },
    { href: `/${locale}/blog`, label: t('blog'), icon: <ShieldCheck size={16} /> },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userCredits = (user as any)?.credits || 0;

  const switchLocale = (newLocale: string) => {
    // Get current path without locale
    const pathWithoutLocale = pathname.replace(`/${locale}`, '');
    // Navigate to new locale with same path
    router.push(`/${newLocale}${pathWithoutLocale || ''}`);
  };

  if (!mounted) {
    return (
      <nav className="h-24 sticky top-0 z-[100] border-b border-transparent"></nav>
    );
  }

  return (
    <nav className={`h-24 sticky top-0 z-[100] transition-all duration-500 ${scrolled
      ? "bg-background/80 backdrop-blur-3xl border-b border-white/5 py-2"
      : "bg-transparent border-b border-transparent"
      }`}>
      <div className="max-w-[1600px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all"></div>
            <Sparkles className="text-primary relative z-10" size={32} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-white group-hover:text-primary transition-colors">
            FACE<span className="text-primary">SEEK</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${pathname === link.href
                ? "text-primary"
                : "text-zinc-500 hover:text-white"
                }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="hidden md:flex items-center gap-6">
          {/* Language Switcher */}
          <div className="flex items-center gap-2 bg-white/5 rounded-full p-1">
            <button
              onClick={() => switchLocale('en')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${locale === 'en'
                ? 'bg-primary text-black'
                : 'text-zinc-500 hover:text-white'
                }`}
            >
              EN
            </button>
            <button
              onClick={() => switchLocale('tr')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${locale === 'tr'
                ? 'bg-primary text-black'
                : 'text-zinc-500 hover:text-white'
                }`}
            >
              TR
            </button>
          </div>

          {user ? (
            <>
              {/* Credits Display */}
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <Sparkles size={16} className="text-primary" />
                <span className="text-xs font-black text-white">
                  {userCredits} {t('credits')}
                </span>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors"
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <LogOut size={16} />
                  LOGOUT
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/login`}>
                <Button variant="ghost" size="sm">
                  {t('login')}
                </Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button variant="primary" size="sm">
                  {t('register')}
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-24 left-0 right-0 bg-background/95 backdrop-blur-3xl border-b border-white/5 p-6">
          <div className="flex flex-col gap-4">
            {/* Language Switcher Mobile */}
            <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 mb-4">
              <button
                onClick={() => {
                  switchLocale('en');
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${locale === 'en'
                  ? 'bg-primary text-black'
                  : 'text-zinc-500'
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  switchLocale('tr');
                  setMobileMenuOpen(false);
                }}
                className={`flex-1 px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${locale === 'tr'
                  ? 'bg-primary text-black'
                  : 'text-zinc-500'
                  }`}
              >
                TR
              </button>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 text-sm font-black uppercase tracking-widest p-3 rounded-xl transition-all ${pathname === link.href
                  ? "text-primary bg-primary/10"
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
                  }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 border border-primary/20 rounded-xl">
                  <Sparkles size={16} className="text-primary" />
                  <span className="text-sm font-black text-white">
                    {userCredits} {t('credits')}
                  </span>
                </div>
                <Link
                  href={`/${locale}/dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors p-3"
                >
                  {t('dashboard')}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors p-3"
                >
                  <LogOut size={16} />
                  LOGOUT
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 pt-4">
                <Link href={`/${locale}/login`} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full">
                    {t('login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    {t('register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}