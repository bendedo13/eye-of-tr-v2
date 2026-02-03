"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Bell,
  Search,
  Zap,
  Cpu
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (!adminData && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else if (adminData && !isAdmin) {
      setIsAdmin(true);
    }
  }, [pathname, router, isAdmin]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAdmin) return null;

  const menuItems = [
    { label: "Dashboard", icon: <BarChart3 size={20} />, href: "/admin" },
    { label: "Kullanıcılar", icon: <Users size={20} />, href: "/admin/users" },
    { label: "Fiyatlandırma", icon: <CreditCard size={20} />, href: "/admin/pricing" },
    { label: "Sistem Ayarları", icon: <Settings size={20} />, href: "/admin/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 flex">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-80" : "w-24"
          } glass-dark border-r border-white/5 transition-all duration-500 ease-in-out flex flex-col z-50`}
      >
        <div className="p-8 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                <ShieldCheck size={24} />
              </div>
              <span className="font-black text-xl tracking-tighter text-white uppercase">FACE<span className="text-zinc-600">SEEK</span></span>
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary mx-auto">
              <ShieldCheck size={24} />
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${isSidebarOpen ? "px-6" : "justify-center px-0"
                  } py-4 rounded-2xl transition-all duration-300 group ${isActive
                    ? "bg-primary text-white shadow-xl shadow-primary/20"
                    : "text-zinc-500 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <div className={`${isActive ? "text-white" : "group-hover:text-primary transition-colors"}`}>
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <span className="ml-4 font-black text-[11px] uppercase tracking-[0.2em] animate-in fade-in slide-in-from-left-2 transition-all">
                    {item.label}
                  </span>
                )}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-4">
          {isSidebarOpen && (
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5 space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sistem Status</div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <span className="text-[9px] font-black text-emerald-500">ONLINE</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-bold uppercase">CPU Load</span>
                  <span className="text-white font-black">24%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[24%] h-full bg-primary"></div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarOpen ? "px-6" : "justify-center px-0"
              } py-4 text-zinc-500 hover:text-rose-500 transition-all rounded-2xl hover:bg-rose-500/5 group`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="ml-4 font-black text-[11px] uppercase tracking-[0.2em]">Sistemden Çık</span>}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-12 bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-primary transition-colors rounded-r-lg z-50 shadow-xl"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_var(--color-primary-glow)_0%,_transparent_50%)]">
        {/* Top Header */}
        <header className="h-24 border-b border-white/5 backdrop-blur-xl flex items-center justify-between px-10 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                placeholder="GLOBAL PROTOCOL SEARCH..."
                className="bg-black/40 border border-white/5 rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black tracking-widest text-white focus:outline-none focus:border-primary/50 w-80 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all hover:bg-white/10">
              <Bell size={20} />
              <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border-2 border-zinc-950"></span>
            </button>
            <div className="h-10 w-[1px] bg-white/5 mx-2"></div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-black text-white uppercase tracking-tighter">System Admin</p>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Clearance: Lvl 9</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 p-1">
                <div className="w-full h-full rounded-lg bg-zinc-800 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-primary" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}