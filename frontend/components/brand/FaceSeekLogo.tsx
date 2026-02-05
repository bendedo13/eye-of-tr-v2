"use client";

import React from 'react';

interface FaceSeekLogoProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    animated?: boolean;
    className?: string;
}

export default function FaceSeekLogo({
    size = 'md',
    showText = true,
    animated = true,
    className = ''
}: FaceSeekLogoProps) {
    const sizes = {
        sm: { icon: 24, text: 'text-lg' },
        md: { icon: 32, text: 'text-xl' },
        lg: { icon: 40, text: 'text-2xl' },
        xl: { icon: 48, text: 'text-3xl' }
    };

    const iconSize = sizes[size].icon;
    const textSize = sizes[size].text;

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Hexagonal Scanner Icon */}
            <div className="relative" style={{ width: iconSize, height: iconSize }}>
                <svg
                    width={iconSize}
                    height={iconSize}
                    viewBox="0 0 512 512"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={animated ? "animate-pulse-glow" : ""}
                >
                    <defs>
                        <linearGradient id="eyeGradient" x1="256" y1="100" x2="256" y2="412" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#00d9ff" />
                            <stop offset="100%" stopColor="#0ea5e9" />
                        </linearGradient>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Outer Iris/Shutter */}
                    <path 
                        d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm0 376c-92.8 0-168-75.2-168-168S163.2 88 256 88s168 75.2 168 168-75.2 168-168 168z" 
                        fill="url(#eyeGradient)" 
                        opacity="0.2"
                    />
                    
                    {/* Digital Eye Segments */}
                    <path 
                        d="M256 120c-75.1 0-136 60.9-136 136 0 20.3 4.5 39.4 12.5 56.7l-26.6 15.3C92.8 307.7 88 282.6 88 256c0-92.8 75.2-168 168-168 26.6 0 51.7 4.8 74.6 13.5l-15.3 26.6c-17.3-8-36.4-12.5-56.7-12.5z" 
                        fill="#00d9ff" 
                    />
                    <path 
                        d="M392 256c0 26.6-4.8 51.7-13.5 74.6l15.3 26.6c17.3-17.3 29.8-39.7 35.8-64.6l-30.2-8.1c-1.8 11.5-6.8 22.1-14.3 31.1l6.9 12-26.6-15.3c8-17.3 12.5-36.4 12.5-56.7 0-75.1-60.9-136-136-136-20.3 0-39.4 4.5-56.7 12.5l15.3 26.6c17.3-8 36.4-12.5 56.7-12.5 57.2 0 104 46.8 104 104z" 
                        fill="#00d9ff" 
                        opacity="0.8"
                    />
                    
                    {/* Central Pupil/Lens */}
                    <circle cx="256" cy="256" r="48" fill="#ffffff"/>
                    <circle cx="256" cy="256" r="24" fill="#0a0e27"/>
                    
                    {/* Tech Accents */}
                    <rect x="248" y="48" width="16" height="40" rx="8" fill="#00d9ff" />
                    <rect x="248" y="424" width="16" height="40" rx="8" fill="#00d9ff" />
                    <rect x="48" y="248" width="40" height="16" rx="8" fill="#00d9ff" />
                    <rect x="424" y="248" width="40" height="16" rx="8" fill="#00d9ff" />

                    {/* Scanning Animation Line (Optional overlay) */}
                    {animated && (
                        <rect x="0" y="250" width="512" height="2" fill="#00d9ff" opacity="0.5" className="animate-scanning">
                             <animate attributeName="y" values="0;512;0" dur="3s" repeatCount="indefinite" />
                        </rect>
                    )}
                </svg>
            </div>

            {/* Logo Text */}
            {showText && (
                <div className={`font-bold ${textSize} tracking-tight`}>
                    <span className="text-[#00d9ff]">Face</span>
                    <span className="text-white ml-1">Seek</span>
                </div>
            )}
        </div>
    );
}
