"use client";

import React, { useState, useEffect } from 'react';
import { Search, Shield, Zap, Globe, Target, Eye } from 'lucide-react';

export default function EnhancedFacialRecognitionDemo() {
    const [scanProgress, setScanProgress] = useState(0);
    const [activeFeature, setActiveFeature] = useState(0);

    const features = [
        { icon: <Search size={20} />, label: "Multi-Engine Search", color: "#00d9ff" },
        { icon: <Shield size={20} />, label: "GDPR Compliant", color: "#10b981" },
        { icon: <Zap size={20} />, label: "Lightning Fast", color: "#fbbf24" },
        { icon: <Globe size={20} />, label: "Global Database", color: "#8b5cf6" },
    ];

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setScanProgress(prev => (prev >= 100 ? 0 : prev + 2));
        }, 50);

        const featureInterval = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % features.length);
        }, 2000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(featureInterval);
        };
    }, []);

    return (
        <div className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27] rounded-2xl overflow-hidden border border-[#00d9ff]/20 scanner-frame">
            {/* Animated Background Grid */}
            <div className="absolute inset-0 circuit-pattern opacity-20"></div>
            <div className="absolute inset-0 data-stream opacity-20"></div>

            {/* Scanning Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#00d9ff]/10">
                <div
                    className="h-full bg-gradient-to-r from-[#00d9ff] via-[#0ea5e9] to-[#8b5cf6] transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                ></div>
            </div>

            {/* Main Content Area */}
            <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative w-full max-w-md">
                    {/* Central Hexagonal Scanner */}
                    <svg width="100%" height="350" viewBox="0 0 300 350" className="opacity-90">
                        {/* Outer Hexagon - Pulsing */}
                        <path
                            d="M150 30 L250 90 L250 210 L150 270 L50 210 L50 90 Z"
                            stroke="url(#scanGradient)"
                            strokeWidth="3"
                            fill="none"
                            className="animate-pulse"
                            opacity="0.6"
                        />

                        {/* Inner Hexagon - Rotating */}
                        <path
                            d="M150 60 L220 100 L220 200 L150 240 L80 200 L80 100 Z"
                            stroke="url(#scanGradient2)"
                            strokeWidth="2"
                            fill="rgba(0, 217, 255, 0.05)"
                            className="animate-pulse"
                            style={{ animationDelay: '0.5s' }}
                        />

                        {/* Facial Recognition Grid - 3x3 */}
                        {[...Array(9)].map((_, i) => {
                            const row = Math.floor(i / 3);
                            const col = i % 3;
                            const x = 100 + col * 50;
                            const y = 110 + row * 40;
                            const delay = i * 0.15;

                            return (
                                <g key={i}>
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r="5"
                                        fill={features[activeFeature].color}
                                        className="biometric-dot"
                                        style={{ animationDelay: `${delay}s` }}
                                    />
                                    {/* Connection Lines */}
                                    {i < 8 && (i % 3 !== 2) && (
                                        <line
                                            x1={x}
                                            y1={y}
                                            x2={x + 50}
                                            y2={y}
                                            stroke={features[activeFeature].color}
                                            strokeWidth="1"
                                            opacity="0.3"
                                        />
                                    )}
                                    {i < 6 && (
                                        <line
                                            x1={x}
                                            y1={y}
                                            x2={x}
                                            y2={y + 40}
                                            stroke={features[activeFeature].color}
                                            strokeWidth="1"
                                            opacity="0.3"
                                        />
                                    )}
                                </g>
                            );
                        })}

                        {/* Scanning Line - Vertical */}
                        <line
                            x1="150"
                            y1="30"
                            x2="150"
                            y2="270"
                            stroke="url(#scanLineGradient)"
                            strokeWidth="2"
                            opacity={scanProgress / 100}
                        />

                        {/* Gradients */}
                        <defs>
                            <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00d9ff" />
                                <stop offset="50%" stopColor="#0ea5e9" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                            <linearGradient id="scanGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="50%" stopColor="#0ea5e9" />
                                <stop offset="100%" stopColor="#00d9ff" />
                            </linearGradient>
                            <linearGradient id="scanLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="transparent" />
                                <stop offset="50%" stopColor="#00d9ff" />
                                <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Feature Indicators - Rotating */}
                    <div className="absolute -bottom-4 left-0 right-0 flex justify-center gap-3">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-500 ${idx === activeFeature
                                        ? 'bg-[#00d9ff]/20 border-[#00d9ff]/50 scale-110'
                                        : 'bg-[#0a0e27]/50 border-white/10 scale-90 opacity-50'
                                    }`}
                                style={{ borderColor: idx === activeFeature ? feature.color : undefined }}
                            >
                                <div style={{ color: feature.color }}>{feature.icon}</div>
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider whitespace-nowrap">
                                    {feature.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Indicators */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                <div className="flex items-center gap-2 bg-[#10b981]/10 border border-[#10b981]/30 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
                    <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">Scanning Active</span>
                </div>
                <div className="flex items-center gap-2 bg-[#00d9ff]/10 border border-[#00d9ff]/30 px-3 py-1.5 rounded-full">
                    <Eye size={12} className="text-[#00d9ff]" />
                    <span className="text-[10px] font-bold text-[#00d9ff] uppercase tracking-wider">{scanProgress}% Complete</span>
                </div>
                <div className="flex items-center gap-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 px-3 py-1.5 rounded-full">
                    <Target size={12} className="text-[#8b5cf6]" />
                    <span className="text-[10px] font-bold text-[#8b5cf6] uppercase tracking-wider">128 Points</span>
                </div>
            </div>

            {/* Corner Brackets - Animated */}
            <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 border-[#00d9ff]/60 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-[#00d9ff]/60 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 border-[#00d9ff]/60 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 border-[#00d9ff]/60 animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            {/* Data Flow Particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-[#00d9ff] rounded-full opacity-60"
                        style={{
                            left: `${20 + i * 15}%`,
                            top: '10%',
                            animation: `data-flow 3s linear infinite`,
                            animationDelay: `${i * 0.5}s`,
                        }}
                    ></div>
                ))}
            </div>
        </div>
    );
}
