/**
 * Visual Search Types
 * Types for web-scale image search across multiple providers
 */

export type SearchProvider = 'google' | 'bing' | 'yandex' | 'all';

export interface ImageSearchResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  sourceUrl: string;
  sourceDomain: string;
  provider: SearchProvider;
  timestamp?: string;
  contentType?: string;
  encodingFormat?: string;
  hostPageUrl?: string;
  hostPageDomain?: string;
  description?: string;
}

export interface VisualSearchParams {
  query: string;
  provider: SearchProvider;
  count?: number;
  offset?: number;
  safeSearch?: boolean;
  imageType?: 'photo' | 'clipart' | 'lineart' | 'animated' | 'transparent';
  size?: 'small' | 'medium' | 'large' | 'wallpaper' | 'all';
  color?: string;
  license?: 'any' | 'public' | 'share' | 'sharecommercially' | 'modify';
}

export interface VisualSearchResponse {
  results: ImageSearchResult[];
  totalResults: number;
  provider: SearchProvider;
  query: string;
  nextOffset?: number;
  searchTime: number;
  error?: string;
}

export interface ProviderSearchStats {
  provider: SearchProvider;
  resultCount: number;
  searchTime: number;
  success: boolean;
  error?: string;
}

export interface AggregatedSearchResponse {
  allResults: ImageSearchResult[];
  providerStats: ProviderSearchStats[];
  totalResults: number;
  query: string;
  timestamp: string;
}
