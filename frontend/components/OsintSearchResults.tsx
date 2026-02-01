"use client";

import type { GoogleSearchResult } from "@/lib/googleSearch";
import { cleanSnippet, extractPlatform } from "@/lib/googleSearch";

interface OsintSearchResultsProps {
  results: GoogleSearchResult[];
  query: string;
  totalResults: string;
  searchTime: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

/**
 * Google Search Results Display
 */
export default function OsintSearchResults({
  results,
  query,
  totalResults,
  searchTime,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: OsintSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-12 border border-white/20 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Results Found</h3>
        <p className="text-gray-600">
          No results found for "<span className="font-semibold">{query}</span>"
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Try adjusting your search terms or use a different query
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Info */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Search Results</h2>
            <p className="text-gray-600 text-sm">
              About{" "}
              <span className="font-semibold text-indigo-600">
                {parseInt(totalResults).toLocaleString()}
              </span>{" "}
              results ({searchTime} seconds)
            </p>
          </div>
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full font-bold">
            {results.length} shown
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="space-y-4">
        {results.map((result, index) => {
          const platform = extractPlatform(result.displayLink);
          const snippet = cleanSnippet(result.htmlSnippet);
          const thumbnail = result.pagemap?.cse_thumbnail?.[0];

          return (
            <div
              key={`${result.link}-${index}`}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 border border-gray-100"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                {thumbnail && (
                  <div className="flex-shrink-0">
                    <img
                      src={thumbnail.src}
                      alt={result.title}
                      className="w-20 h-20 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Platform Badge */}
                  {platform && (
                    <div className="mb-2">
                      <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                        {platform}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xl font-semibold text-indigo-600 hover:text-indigo-800 hover:underline block mb-2"
                  >
                    {result.title}
                  </a>

                  {/* Display URL */}
                  <p className="text-sm text-green-600 mb-2 truncate">
                    {result.displayLink}
                  </p>

                  {/* Snippet */}
                  <p className="text-gray-600 text-sm line-clamp-3">{snippet}</p>

                  {/* View Link */}
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium text-sm mt-3"
                  >
                    View Page
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2"
          >
            {isLoadingMore ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading More...
              </>
            ) : (
              <>
                <span>📄</span>
                Load More Results
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
