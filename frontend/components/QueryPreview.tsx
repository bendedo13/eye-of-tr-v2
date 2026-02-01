"use client";

import { useState } from "react";
import type { OsintQuery } from "@/lib/osintTypes";
import { copyQueryToClipboard } from "@/lib/osintQueries";
import { toast } from "@/lib/toast";

interface QueryPreviewProps {
  query: OsintQuery;
}

/**
 * Query önizleme ve işlem kartı
 */
export default function QueryPreview({ query }: QueryPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyQueryToClipboard(query.query);
    if (success) {
      setCopied(true);
      toast.success("Query copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy query");
    }
  };

  const handleOpenInGoogle = () => {
    window.open(query.url, "_blank", "noopener,noreferrer");
  };

  const categoryIcons: Record<string, string> = {
    "social-media": "👥",
    "documents": "📄",
    "images": "🖼️",
    "public-profiles": "👤",
    "other": "🔍",
  };

  const categoryColors: Record<string, string> = {
    "social-media": "bg-blue-100 text-blue-700",
    "documents": "bg-green-100 text-green-700",
    "images": "bg-purple-100 text-purple-700",
    "public-profiles": "bg-orange-100 text-orange-700",
    "other": "bg-gray-100 text-gray-700",
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-5 border border-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryIcons[query.category]}</span>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">
              {query.platform || query.category.replace("-", " ").toUpperCase()}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{query.description}</p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            categoryColors[query.category]
          }`}
        >
          {query.category}
        </span>
      </div>

      {/* Query */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3 font-mono text-sm text-gray-700 break-all">
        {query.query}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleOpenInGoogle}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <span>🔗</span>
          Open in Google
        </button>

        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
      </div>
    </div>
  );
}
