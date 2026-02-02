import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    hasScanline?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className = '',
    hasScanline = false
}) => {
    return (
        <div className={`glass-card relative overflow-hidden ${className}`}>
            {hasScanline && <div className="scanline" />}
            <div className="relative z-10">
                {children}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        </div>
    );
};
