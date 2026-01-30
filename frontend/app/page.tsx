'use client'

import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadRes = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      
      const searchRes = await fetch(`http://localhost:8000/api/search?filename=${uploadData.filename}`, {
        method: 'POST',
      })
      const searchData = await searchRes.json()
      
      setResults(searchData)
    } catch (error) {
      alert('Error: ' + error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-2 text-gray-800">
          Eye of TR
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Face Search Platform
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer inline-block">
              <div className="text-6xl mb-4">📸</div>
              <div className="text-lg font-semibold text-gray-700 mb-2">
                {file ? file.name : 'Click to upload image'}
              </div>
              <div className="text-sm text-gray-500">JPG, PNG, WEBP</div>
            </label>
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-xl transition-all text-lg"
            >
              {uploading ? 'Searching...' : 'Search Face'}
            </button>
          )}
        </div>

        {results && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Results: {results.total_matches}</h2>
            
            {Object.entries(results.providers).map(([provider, data]: [string, any]) => (
              <div key={provider} className="mb-6">
                <h3 className="text-xl font-semibold mb-3 capitalize">{provider}</h3>
                
                {data.status === 'success' && data.matches && data.matches.length > 0 ? (
                  <div className="space-y-4">
                    {data.matches.map((match: any, i: number) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="font-semibold">{match.platform}</div>
                        {match.username && <div>@{match.username}</div>}
                        <div className="text-sm text-gray-500">{Math.round(match.confidence * 100)}% match</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No matches</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}