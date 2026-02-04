"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import {
    X,
    Sliders,
    Zap,
    Shield,
    Info,
    AlertCircle,
    Sparkles,
} from "lucide-react";

interface AdvancedSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (params: AdvancedSearchParams) => void;
    isSearching: boolean;
}

export interface AdvancedSearchParams {
    search_precision: "low" | "medium" | "high";
    region_filter?: string;
    confidence_threshold: number;
    max_results: number;
    enable_ai_explanation: boolean;
}

export default function AdvancedSearchModal({
    isOpen,
    onClose,
    onSearch,
    isSearching,
}: AdvancedSearchModalProps) {
    const [precision, setPrecision] = useState<"low" | "medium" | "high">("medium");
    const [confidenceThreshold, setConfidenceThreshold] = useState<number>(50);
    const [maxResults, setMaxResults] = useState<number>(10);
    const [enableAI, setEnableAI] = useState<boolean>(false);
    const [acceptedDisclaimer, setAcceptedDisclaimer] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleSearch = () => {
        if (!acceptedDisclaimer) return;

        const params: AdvancedSearchParams = {
            search_precision: precision,
            confidence_threshold: confidenceThreshold / 100, // Convert to 0-1 range
            max_results: maxResults,
            enable_ai_explanation: enableAI,
        };

        onSearch(params);
    };

    const precisionLabels = {
        low: "Düşük",
        medium: "Orta",
        high: "Yüksek",
    };

    const precisionDescriptions = {
        low: "Daha fazla sonuç, daha geniş eşleşme",
        medium: "Dengeli sonuç kalitesi",
        high: "Daha az, daha yüksek kaliteli sonuç",
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                <Sliders className="text-primary" size={28} />
                                DETAYLI ARAMA
                            </h2>
                            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">
                                Gelişmiş Parametreler & AI Destekli Analiz
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSearching}
                            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Credit Cost Notice */}
                    <div className="mb-8 bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-wide">
                                2 Kredi Gerekli
                            </h3>
                            <p className="text-xs text-zinc-400 font-medium mt-1">
                                Normal aramadan daha gelişmiş özellikler sunar
                            </p>
                        </div>
                    </div>

                    {/* Search Precision */}
                    <div className="mb-8">
                        <label className="block text-sm font-black text-white uppercase tracking-wide mb-4">
                            Arama Hassasiyeti
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {(["low", "medium", "high"] as const).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setPrecision(level)}
                                    disabled={isSearching}
                                    className={`p-4 rounded-xl border-2 transition-all ${precision === level
                                            ? "bg-primary/20 border-primary text-white"
                                            : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
                                        } disabled:opacity-50`}
                                >
                                    <div className="text-xs font-black uppercase tracking-widest mb-1">
                                        {precisionLabels[level]}
                                    </div>
                                    <div className="text-[10px] text-zinc-500 font-medium">
                                        {precisionDescriptions[level]}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Confidence Threshold */}
                    <div className="mb-8">
                        <label className="block text-sm font-black text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                            Güven Eşiği: {confidenceThreshold}%
                            <div className="relative group">
                                <Info size={14} className="text-zinc-500 cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 bg-zinc-900 text-xs text-zinc-300 p-3 rounded-lg border border-white/10">
                                    Bu değerin altındaki eşleşmeler filtrelenir
                                </div>
                            </div>
                        </label>
                        <div className="relative">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                                disabled={isSearching}
                                className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-2">
                                <span>0%</span>
                                <span>50%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Max Results */}
                    <div className="mb-8">
                        <label className="block text-sm font-black text-white uppercase tracking-wide mb-4">
                            Maksimum Sonuç Sayısı
                        </label>
                        <div className="flex gap-3">
                            {[5, 10, 15, 20].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setMaxResults(num)}
                                    disabled={isSearching}
                                    className={`flex-1 py-3 rounded-xl border-2 transition-all text-sm font-black ${maxResults === num
                                            ? "bg-primary/20 border-primary text-white"
                                            : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"
                                        } disabled:opacity-50`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Explanation Toggle */}
                    <div className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                                <Sparkles size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-2">
                                    AI Destekli Açıklama
                                </h3>
                                <p className="text-xs text-zinc-400 font-medium mb-4">
                                    ChatGPT kullanarak sonuçları detaylı açıkla
                                </p>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={enableAI}
                                        onChange={(e) => setEnableAI(e.target.checked)}
                                        disabled={isSearching}
                                        className="w-5 h-5 accent-primary disabled:opacity-50"
                                    />
                                    <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                                        AI Açıklamayı Etkinleştir
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <AlertCircle className="text-amber-500 flex-shrink-0" size={20} />
                            <div className="text-xs text-amber-200 font-medium leading-relaxed">
                                Sonuçlar bilimsel analize dayanmaktadır. FaceSeek kimlik
                                iddiasında bulunmaz. Sonuçlar bilgilendirme amaçlıdır ve kesinlik
                                içermez.
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={acceptedDisclaimer}
                                onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                                disabled={isSearching}
                                className="w-4 h-4 accent-amber-500 disabled:opacity-50"
                            />
                            <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                                Sorumluluk beyanını kabul ediyorum
                            </span>
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 h-14 bg-white/5 border-white/10 hover:bg-white/10"
                            disabled={isSearching}
                        >
                            İPTAL
                        </Button>
                        <Button
                            onClick={handleSearch}
                            className="flex-1 h-14"
                            isLoading={isSearching}
                            disabled={isSearching || !acceptedDisclaimer}
                        >
                            <Shield className="mr-2" size={18} />
                            DETAYLI ARAMA BAŞLAT
                        </Button>
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
