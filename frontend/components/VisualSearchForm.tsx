"use client";

import { useState, FormEvent } from 'react';
import { SearchProvider } from '@/lib/visualSearchTypes';

/**
 * Visual Search Form Component
 * Search form for web-scale image search
 */
interface VisualSearchFormProps {
  onSearch: (query: string, provider: SearchProvider, options: SearchOptions) => void;
  isSearching: boolean;
}

export interface SearchOptions {
  count: number;
  safeSearch: boolean;
  imageType?: 'photo' | 'clipart' | 'lineart' | 'animated' | 'transparent';
  size?: 'small' | 'medium' | 'large' | 'wallpaper' | 'all';
  color?: string;
}

export default function VisualSearchForm({ onSearch, isSearching }: VisualSearchFormProps) {
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<SearchProvider>('google');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [options, setOptions] = useState<SearchOptions>({
    count: 20,
    safeSearch: true,
    imageType: undefined,
    size: 'all',
    color: undefined,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), provider, options);
    }
  };

  const handleReset = () => {
    setQuery('');
    setProvider('google');
    setOptions({
      count: 20,
      safeSearch: true,
      imageType: undefined,
      size: 'all',
      color: undefined,
    });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Web-Scale Visual Search</h2>
        <p className="text-gray-600">
          Search billions of images across Google, Bing, and Yandex
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Query
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter person name or username..."
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors"
            disabled={isSearching}
            required
          />
        </div>

        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Provider
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setProvider('google')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                provider === 'google'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSearching}
            >
              🔍 Google
            </button>
            <button
              type="button"
              onClick={() => setProvider('bing')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                provider === 'bing'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSearching}
            >
              🅱️ Bing
            </button>
            <button
              type="button"
              onClick={() => setProvider('yandex')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                provider === 'yandex'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSearching}
            >
              🇷🇺 Yandex
            </button>
            <button
              type="button"
              onClick={() => setProvider('all')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                provider === 'all'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={isSearching}
            >
              🌐 All
            </button>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2"
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            {/* Results Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results per page
              </label>
              <select
                value={options.count}
                onChange={(e) =>
                  setOptions({ ...options, count: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                disabled={isSearching}
              >
                <option value={10}>10 images</option>
                <option value={20}>20 images</option>
                <option value={30}>30 images</option>
                <option value={50}>50 images</option>
              </select>
            </div>

            {/* Image Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Size
              </label>
              <select
                value={options.size || 'all'}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    size: e.target.value as SearchOptions['size'],
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                disabled={isSearching}
              >
                <option value="all">All sizes</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="wallpaper">Wallpaper</option>
              </select>
            </div>

            {/* Image Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Type
              </label>
              <select
                value={options.imageType || ''}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    imageType: e.target.value as SearchOptions['imageType'],
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-indigo-500 focus:outline-none"
                disabled={isSearching}
              >
                <option value="">All types</option>
                <option value="photo">Photo</option>
                <option value="clipart">Clipart</option>
                <option value="lineart">Line art</option>
                <option value="animated">Animated</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>

            {/* Safe Search */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="safeSearch"
                checked={options.safeSearch}
                onChange={(e) =>
                  setOptions({ ...options, safeSearch: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                disabled={isSearching}
              />
              <label htmlFor="safeSearch" className="ml-2 text-sm text-gray-700">
                Enable SafeSearch
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Searching...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🔍 Search Images
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSearching}
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Info Notice */}
      <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <p className="text-xs text-indigo-800">
          <strong>💡 Tip:</strong> Use specific queries like "John Doe profile picture" or
          "@username social media" for best results. Advanced filters help narrow down your
          search.
        </p>
      </div>
    </div>
  );
}
