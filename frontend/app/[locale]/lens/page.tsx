"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Upload, Search, MapPin, User as UserIcon, AlertCircle, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LensAnalysisPage() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"face_search" | "location_search">("face_search");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !token) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/lens-analysis?search_type=${searchType}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data.data);
    } catch (err) {
      setError("An error occurred during analysis. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Real-Time Lens Analysis
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Advanced visual intelligence for face and location analysis using next-gen lens data.
          </p>
        </div>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Upload Image
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-4 p-1 bg-gray-800 rounded-lg">
                  <button
                    onClick={() => setSearchType("face_search")}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                      searchType === "face_search" 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Face Search
                    </div>
                  </button>
                  <button
                    onClick={() => setSearchType("location_search")}
                    className={`flex-1 py-2 px-4 rounded-md transition-all ${
                      searchType === "location_search" 
                        ? "bg-purple-600 text-white shadow-lg" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location Search
                    </div>
                  </button>
                </div>

                <div className="relative border-2 border-dashed border-gray-700 rounded-xl p-8 hover:border-blue-500 transition-colors group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="text-center space-y-2">
                    {preview ? (
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="max-h-64 mx-auto rounded-lg shadow-2xl"
                      />
                    ) : (
                      <div className="py-8">
                        <Upload className="w-12 h-12 text-gray-600 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                        <p className="text-gray-400">Drop your image here or click to browse</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Start Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-red-900/20 border border-red-800 text-red-200 p-4 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </motion.div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Knowledge Graph Card */}
                  {result.knowledge_graph && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                      <h3 className="text-xl font-semibold mb-4 text-purple-400 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Knowledge Graph
                      </h3>
                      <div className="space-y-4">
                        <h4 className="text-2xl font-bold">{result.knowledge_graph.title}</h4>
                        {result.knowledge_graph.subtitle && (
                          <p className="text-gray-400">{result.knowledge_graph.subtitle}</p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          {result.knowledge_graph.attributes && Object.entries(result.knowledge_graph.attributes).map(([key, value]) => (
                            <div key={key} className="bg-black/40 p-3 rounded-lg">
                              <span className="text-xs text-gray-500 uppercase">{key}</span>
                              <p className="font-medium text-sm truncate">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                        {result.knowledge_graph.description && (
                          <p className="text-sm text-gray-300 leading-relaxed border-t border-gray-800 pt-4">
                            {result.knowledge_graph.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visual Matches */}
                  <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
                    <h3 className="text-xl font-semibold mb-4 text-blue-400">Visual Matches</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {result.visual_matches.map((match: any, idx: number) => (
                        <a
                          key={idx}
                          href={match.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-4 p-3 bg-black/40 rounded-xl hover:bg-black/60 transition-colors group"
                        >
                          <img
                            src={match.thumbnail}
                            alt={match.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                              {match.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 truncate">{match.source}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
