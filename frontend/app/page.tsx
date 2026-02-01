'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const { user, token, loading, mounted, logout } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    if (!token) {
      setError('Please sign in to upload and search')
      return
    }

    setUploading(true)
    setResults(null)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const apiBase = typeof window !== 'undefined' 
        ? process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        : 'http://localhost:8000'
      
      const uploadRes = await fetch(`${apiBase}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      
      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json()
        throw new Error(uploadData.detail || 'Upload failed')
      }
      
      const uploadData = await uploadRes.json()

      const searchRes = await fetch(`${apiBase}/api/search?filename=${uploadData.filename}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!searchRes.ok) {
        const searchData = await searchRes.json()
        throw new Error(searchData.detail || 'Search failed')
      }
      
      const searchData = await searchRes.json()
      setResults(searchData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="pt-12 pb-8">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex justify-end gap-4 mb-4">
            {mounted && !loading && (
              user ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">{user.email}</span>
                  <button
                    onClick={logout}
                    className="text-indigo-600 hover:underline font-medium"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login" className="text-indigo-600 hover:underline font-medium">
                    Sign in
                  </Link>
                  <Link href="/register" className="text-indigo-600 hover:underline font-medium">
                    Register
                  </Link>
                </>
              )
            )}
          </div>
          <div className="text-center mb-4">
            <div className="inline-block">
              <div className="text-6xl mb-3">👁️</div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Eye of TR
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 font-semibold hover:text-red-900"
              >
                ✕
              </button>
            </div>
          )}
          <p className="text-center text-gray-600 text-lg">
            Advanced Face Recognition Platform
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          {!preview ? (
            <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-16 text-center hover:border-indigo-500 transition-all cursor-pointer bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-7xl mb-6 animate-bounce">📸</div>
                <div className="text-2xl font-bold text-gray-700 mb-3">
                  Click to Upload Image
                </div>
                <div className="text-gray-500">JPG, PNG, WEBP • Max 10MB</div>
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border-4 border-indigo-200 max-w-md mx-auto">
                <img src={preview} alt="Preview" className="w-full h-auto" />
              </div>
              
              <div className="flex gap-4">
                <label 
                  htmlFor="file-upload" 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all text-center cursor-pointer"
                >
                  Change Image
                </label>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg"
                >
                  {uploading ? 'Searching...' : 'Search Face'}
                </button>
              </div>
            </div>
          )}
        </div>

        {results && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Search Results</h2>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full font-bold">
                {results.total_matches || 0} Matches
              </div>
            </div>
            
            {results.status === 'success' && results.matches && results.matches.length > 0 ? (
              <div>
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Waterfall Strategy:</span> Found by <span className="font-bold text-indigo-600">{results.stopped_at}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Providers checked: {results.providers_used?.join(' → ')}
                  </div>
                  {results.total_cost > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Total cost: <span className="font-bold text-green-600">${results.total_cost.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {results.matches.map((match: any, i: number) => (
                    <div key={i} className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold text-xl capitalize">{match.platform}</div>
                          {match.username && <div className="text-gray-600 mt-1">@{match.username}</div>}
                          {match.profile_url && (
                            <a href={match.profile_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 text-sm hover:underline mt-2 inline-block">
                              View Profile →
                            </a>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-5 py-2 rounded-full font-bold shadow-lg">
                            {(match.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">🔍</div>
                <div className="text-2xl font-semibold mb-2">No matches found</div>
                {results.providers_used && results.providers_used.length > 0 && (
                  <div className="text-sm mt-4 text-gray-500">
                    Searched in: <span className="font-semibold">{results.providers_used.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}