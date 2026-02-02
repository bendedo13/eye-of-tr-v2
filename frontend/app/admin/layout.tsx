"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const menuItems = [
  { href: "/admin", icon: "📊", label: "Dashboard" },
  { href: "/admin/users", icon: "👥", label: "Kullanıcılar" },
  { href: "/admin/pricing", icon: "💰", label: "Fiyatlandırma" },
  { href: "/admin/settings", icon: "⚙️", label: "Ayarlar" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    if (!stored && pathname !== "/admin/login") {
      router.push("/admin/login");
    } else if (stored) {
      setAdmin(JSON.parse(stored));
    }
  }, [pathname, router]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("admin");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">F</div>
            {sidebarOpen && <span className="text-white font-bold text-lg">FaceSeek Admin</span>}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === item.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white">👤</div>
            {sidebarOpen && (
              <div>
                <div className="text-white text-sm font-medium">{admin.name || "Admin"}</div>
                <div className="text-slate-400 text-xs">{admin.email}</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition">
            <span>🚪</span>
            {sidebarOpen && <span>Çıkış Yap</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700">☰</button>
          <Link href="/" target="_blank" className="text-slate-400 hover:text-white text-sm">🌐 Siteyi Görüntüle</Link>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}