"use client";

import { useState } from 'react';
import { ImageSearchResult } from '@/lib/visualSearchTypes';
import { formatImageSize, extractDomain } from '@/lib/visualSearch';

/**
 * Image Result Card Component
 * Displays a single image search result with metadata
 */
interface ImageResultCardProps {
  result: ImageSearchResult;
  onClick?: () => void;
}

export default function ImageResultCard({ result, onClick }: ImageResultCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const openImageInNewTab = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-500';
      case 'bing':
        return 'bg-green-500';
      case 'yandex':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔍';
      case 'bing':
        return '🅱️';
      case 'yandex':
        return '🇷🇺';
      default:
        return '🔎';
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {!imageError ? (
          <img
            src={result.thumbnailUrl}
            alt={result.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="text-center">
              <span className="text-4xl mb-2 block">🖼️</span>
              <p className="text-xs text-gray-600">Image unavailable</p>
            </div>
          </div>
        )}

        {/* Provider Badge */}
        <div
          className={`absolute top-2 left-2 ${getProviderColor(
            result.provider
          )} text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg`}
        >
          <span>{getProviderIcon(result.provider)}</span>
          <span className="uppercase">{result.provider}</span>
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-3 transition-opacity">
            <button
              onClick={(e) => openImageInNewTab(result.imageUrl, e)}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              View Full
            </button>
            <button
              onClick={(e) => openImageInNewTab(result.sourceUrl, e)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Source
            </button>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {result.title}
        </h3>

        {/* Source Domain */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
          <span className="text-gray-400">🌐</span>
          <span className="truncate">{result.sourceDomain}</span>
        </div>

        {/* Image Dimensions */}
        {result.imageWidth > 0 && result.imageHeight > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="text-gray-400">📐</span>
            <span>{formatImageSize(result.imageWidth, result.imageHeight)}</span>
          </div>
        )}

        {/* Description (if available) */}
        {result.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {result.description}
          </p>
        )}
      </div>

      {/* Quick Actions Footer */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(result.imageUrl);
          }}
          className="flex-1 text-xs text-gray-600 hover:text-indigo-600 transition-colors py-1"
          title="Copy image URL"
        >
          📋 Copy URL
        </button>
        <button
          onClick={(e) => openImageInNewTab(result.hostPageUrl || result.sourceUrl, e)}
          className="flex-1 text-xs text-gray-600 hover:text-indigo-600 transition-colors py-1"
          title="Visit source page"
        >
          🔗 Visit Page
        </button>
      </div>
    </div>
  );
}
