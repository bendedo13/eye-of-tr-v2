"use client";

import type { OsintResult } from "@/lib/osintTypes";

interface OsintResultCardProps {
  result: OsintResult;
}

/**
 * OSINT arama sonucu kartı (placeholder - Google API entegrasyonu için)
 */
export default function OsintResultCard({ result }: OsintResultCardProps) {
  const categoryIcons: Record<string, string> = {
    "social-media": "👥",
    "documents": "📄",
    "images": "🖼️",
    "public-profiles": "👤",
    "other": "🔍",
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 border border-gray-100">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{categoryIcons[result.category]}</span>
        
        <div className="flex-1">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mb-1 block"
          >
            {result.title}
          </a>

          {result.displayUrl && (
            <p className="text-xs text-green-600 mb-2">{result.displayUrl}</p>
          )}

          <p className="text-sm text-gray-600 line-clamp-2">{result.snippet}</p>

          {result.platform && (
            <div className="mt-3">
              <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                {result.platform}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
