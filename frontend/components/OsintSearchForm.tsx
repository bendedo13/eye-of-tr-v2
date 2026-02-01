"use client";

import { useState } from "react";

interface OsintSearchFormProps {
  onSearch: (query: string, searchType: "fullname" | "username") => void;
  isLoading: boolean;
}

/**
 * OSINT Google Search Form
 */
export default function OsintSearchForm({ onSearch, isLoading }: OsintSearchFormProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [searchType, setSearchType] = useState<"fullname" | "username">("fullname");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const query = searchType === "fullname" ? fullName : username;

    if (!query || query.trim().length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }

    if (query.trim().length > 100) {
      setError("Search query must be less than 100 characters");
      return;
    }

    onSearch(query.trim(), searchType);
  };

  const handleReset = () => {
    setFullName("");
    setUsername("");
    setError("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="text-sm font-medium text-blue-800">
              Google Custom Search
            </p>
            <p className="text-xs text-blue-700 mt-1">
              This tool uses Google Custom Search API to find publicly indexed information.
              Results are fetched in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Search Type Toggle */}
      <div className="flex gap-4 justify-center">
        <button
          type="button"
          onClick={() => setSearchType("fullname")}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            searchType === "fullname"
              ? "bg-indigo-600 text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
          disabled={isLoading}
        >
          👤 Full Name
        </button>
        <button
          type="button"
          onClick={() => setSearchType("username")}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            searchType === "username"
              ? "bg-indigo-600 text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
          disabled={isLoading}
        >
          🔤 Username
        </button>
      </div>

      {/* Input Field */}
      <div>
        {searchType === "fullname" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Search for a person's full name across the web
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Search for a username on social media platforms
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <span>🔍</span>
              Search
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="px-6 py-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}