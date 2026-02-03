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
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={animated ? "animate-pulse-glow" : ""}
                >
                    {/* Hexagonal Frame */}
                    <path
                        d="M24 4L40 14V34L24 44L8 34V14L24 4Z"
                        stroke="url(#cyan-gradient)"
                        strokeWidth="2"
                        fill="none"
                        className={animated ? "animate-pulse" : ""}
                    />

                    {/* Biometric Dots - Top Row */}
                    <circle cx="18" cy="18" r="2" fill="#00d9ff" className="biometric-dot" />
                    <circle cx="24" cy="16" r="2" fill="#00d9ff" className="biometric-dot" style={{ animationDelay: '0.2s' }} />
                    <circle cx="30" cy="18" r="2" fill="#00d9ff" className="biometric-dot" style={{ animationDelay: '0.4s' }} />

                    {/* Biometric Dots - Middle Row */}
                    <circle cx="16" cy="24" r="2" fill="#0ea5e9" className="biometric-dot" style={{ animationDelay: '0.1s' }} />
                    <circle cx="24" cy="24" r="2.5" fill="#00d9ff" className="biometric-dot" />
                    <circle cx="32" cy="24" r="2" fill="#0ea5e9" className="biometric-dot" style={{ animationDelay: '0.3s' }} />

                    {/* Biometric Dots - Bottom Row */}
                    <circle cx="18" cy="30" r="2" fill="#8b5cf6" className="biometric-dot" style={{ animationDelay: '0.5s' }} />
                    <circle cx="24" cy="32" r="2" fill="#8b5cf6" className="biometric-dot" style={{ animationDelay: '0.2s' }} />
                    <circle cx="30" cy="30" r="2" fill="#8b5cf6" className="biometric-dot" style={{ animationDelay: '0.4s' }} />

                    {/* Connection Lines */}
                    <line x1="18" y1="18" x2="24" y2="16" stroke="#00d9ff" strokeWidth="0.5" opacity="0.5" />
                    <line x1="24" y1="16" x2="30" y2="18" stroke="#00d9ff" strokeWidth="0.5" opacity="0.5" />
                    <line x1="18" y1="18" x2="16" y2="24" stroke="#00d9ff" strokeWidth="0.5" opacity="0.5" />
                    <line x1="30" y1="18" x2="32" y2="24" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.5" />
                    <line x1="16" y1="24" x2="18" y2="30" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.5" />
                    <line x1="32" y1="24" x2="30" y2="30" stroke="#0ea5e9" strokeWidth="0.5" opacity="0.5" />
                    <line x1="18" y1="30" x2="24" y2="32" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.5" />
                    <line x1="24" y1="32" x2="30" y2="30" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.5" />
                    <line x1="24" y1="16" x2="24" y2="24" stroke="#00d9ff" strokeWidth="0.5" opacity="0.5" />
                    <line x1="24" y1="24" x2="24" y2="32" stroke="#8b5cf6" strokeWidth="0.5" opacity="0.5" />

                    {/* Scanning Line */}
                    {animated && (
                        <line
                            x1="8"
                            y1="24"
                            x2="40"
                            y2="24"
                            stroke="#00d9ff"
                            strokeWidth="1"
                            opacity="0.8"
                            className="animate-scanning"
                        >
                            <animate
                                attributeName="y1"
                                values="10;38;10"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="y2"
                                values="10;38;10"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </line>
                    )}

                    {/* Gradients */}
                    <defs>
                        <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00d9ff" />
                            <stop offset="50%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                    </defs>
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
