/**
 * OSINT modülü için type tanımları
 */

export interface OsintSearchInput {
  fullName?: string;
  username?: string;
  nickname?: string;
  keyword?: string;
}

export type OsintCategory = 
  | "social-media"
  | "documents"
  | "images"
  | "public-profiles"
  | "other";

export interface OsintQuery {
  id: string;
  query: string;
  url: string;
  category: OsintCategory;
  platform?: string;
  description: string;
}

export interface OsintResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  category: OsintCategory;
  platform?: string;
  displayUrl?: string;
}

export interface OsintSearchState {
  queries: OsintQuery[];
  results: OsintResult[];
  loading: boolean;
  error: string | null;
}
