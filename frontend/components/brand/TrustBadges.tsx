"use client";

import React from 'react';
import { Shield, Lock, Eye, Award } from 'lucide-react';

export default function TrustBadges() {
    const badges = [
        {
            icon: Lock,
            text: 'SSL Secure',
            color: '#fbbf24'
        },
        {
            icon: Shield,
            text: 'GDPR Compliant',
            color: '#00d9ff'
        },
        {
            icon: Eye,
            text: 'Privacy Encrypted',
            color: '#8b5cf6'
        },
        {
            icon: Award,
            text: 'ISO 27001',
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
