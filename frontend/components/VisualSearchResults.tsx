"use client";

import { useState } from 'react';
import ImageResultCard from './ImageResultCard';
import {
  ImageSearchResult,
  ProviderSearchStats,
  SearchProvider,
} from '@/lib/visualSearchTypes';

/**
 * Visual Search Results Component
 * Displays grid of image search results with stats
 */
interface VisualSearchResultsProps {
  results: ImageSearchResult[];
  providerStats?: ProviderSearchStats[];
  query: string;
  totalResults: number;
  searchTime?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export default function VisualSearchResults({
  results,
  providerStats,
  query,
  totalResults,
  searchTime,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: VisualSearchResultsProps) {
  const [selectedImage, setSelectedImage] = useState<ImageSearchResult | null>(null);
  const [filterProvider, setFilterProvider] = useState<SearchProvider | 'all'>('all');

  // Filter results by provider
  const filteredResults =
    filterProvider === 'all'
      ? results
      : results.filter((r) => r.provider === filterProvider);

  // Group results by provider for stats
  const providerCounts = results.reduce((acc, result) => {
    acc[result.provider] = (acc[result.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Search Stats */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Search Results for "{query}"
            </h3>
            <p className="text-sm text-gray-600">
              Found {totalResults.toLocaleString()} images
              {searchTime && ` in ${(searchTime / 1000).toFixed(2)}s`}
            </p>
          </div>

          {/* Provider Filter */}
          {providerStats && providerStats.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setFilterProvider('all')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filterProvider === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All ({results.length})
              </button>
              {providerStats.map((stat) => (
                <button
                  key={stat.provider}
                  onClick={() => setFilterProvider(stat.provider)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    filterProvider === stat.provider
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {stat.provider.charAt(0).toUpperCase() + stat.provider.slice(1)} (
                  {stat.resultCount})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Provider Stats Details */}
        {providerStats && providerStats.length > 1 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {providerStats.map((stat) => (
              <div
                key={stat.provider}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800 capitalize">
                    {stat.provider}
                  </span>
                  {stat.success ? (
                    <span className="text-green-600 text-xl">✓</span>
                  ) : (
                    <span className="text-red-600 text-xl">✗</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Results: <strong>{stat.resultCount}</strong>
                  </p>
                  <p>
                    Time: <strong>{(stat.searchTime / 1000).toFixed(2)}s</strong>
                  </p>
                  {stat.error && (
                    <p className="text-red-600 text-xs mt-2">{stat.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Grid */}
      {filteredResults.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredResults.map((result) => (
            <ImageResultCard
              key={result.id}
              result={result}
              onClick={() => setSelectedImage(result)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center border border-white/20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Results Found</h3>
          <p className="text-gray-600">
            {filterProvider !== 'all'
              ? `No results from ${filterProvider}. Try a different provider.`
              : 'Try adjusting your search query or filters.'}
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow-lg"
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Loading More...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                ⬇️ Load More Results
              </span>
            )}
          </button>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 pr-4">
                  {selectedImage.title}
                </h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-4">
                <img
                  src={selectedImage.imageUrl}
                  alt={selectedImage.title}
                  className="w-full h-auto rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = selectedImage.thumbnailUrl;
                  }}
                />
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Source:</strong>{' '}
                  <a
                    href={selectedImage.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    {selectedImage.sourceDomain}
                  </a>
                </p>
                <p>
                  <strong>Provider:</strong>{' '}
                  <span className="capitalize">{selectedImage.provider}</span>
                </p>
                <p>
                  <strong>Dimensions:</strong> {selectedImage.imageWidth} ×{' '}
                  {selectedImage.imageHeight}
                </p>
                {selectedImage.description && (
                  <p>
                    <strong>Description:</strong> {selectedImage.description}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <a
                  href={selectedImage.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 rounded-lg font-medium transition-colors"
                >
                  Open Full Image
                </a>
                <a
                  href={selectedImage.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-center py-2 rounded-lg font-medium transition-colors"
                >
                  Visit Source Page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
