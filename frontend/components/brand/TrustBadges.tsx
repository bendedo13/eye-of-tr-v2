"use client";

import React from 'react';
import { Shield, Lock, Eye, Trash2 } from 'lucide-react';

export default function TrustBadges() {
    const badges = [
        {
            icon: Lock,
            text: 'SSL Şifreli Bağlantı',
            color: '#fbbf24'
        },
        {
            icon: Shield,
            text: 'Kötüye Kullanım Koruması',
            color: '#00d9ff'
        },
        {
            icon: Eye,
            text: 'Önce Gizlilik',
            color: '#8b5cf6'
        },
        {
            icon: Trash2,
            text: 'Kayıt Tutulmaz',
            color: '#10b981'
        }
    ];

    return (
        <div className="flex flex-wrap items-center gap-3">
            {badges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                    <div
                        key={index}
                        className="trust-badge group hover:scale-105 transition-transform duration-200"
                    >
                        <Icon
                            size={14}
                            style={{ color: badge.color }}
                            className="group-hover:drop-shadow-[0_0_8px_currentColor]"
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                            {badge.text}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
