import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Search,
    History,
    CreditCard,
    Settings,
    ChevronLeft,
    ChevronRight,
    Shield,
    Zap,
    LayoutDashboard
} from 'lucide-react';

export const Sidebar: React.FC = () => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', href: '/dashboard' },
        { icon: <Search size={20} />, label: 'Yeni Arama', href: '/search' },
        { icon: <History size={20} />, label: 'Geçmiş', href: '/history' },
        { icon: <Zap size={20} />, label: 'Fiyatlandırma', href: '/pricing' },
        { icon: <ChevronRight size={20} />, label: 'API Erişimi', href: '/api-access' },
        { icon: <Settings size={20} />, label: 'Ayarlar', href: '/profile' },
    ];

    return (
        <aside
            className={`h-screen sticky top-0 bg-surface border-r border-glass-border transition-all duration-300 z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}
        >
            <div className="flex flex-col h-full p-4">
                {/* Logo Section */}
                <div className="flex items-center gap-3 px-2 mb-8 h-12">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <Shield className="text-white" size={24} />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold tracking-tighter text-white">FACE-SEEK</span>
                    )}
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`nav-link ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                                title={isCollapsed ? item.label : ''}
                            >
                                <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="pt-4 border-t border-glass-border">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors"
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : (
                            <div className="flex items-center gap-2">
                                <ChevronLeft size={20} />
                                <span className="text-sm font-medium">Paneli Daralt</span>
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
};
