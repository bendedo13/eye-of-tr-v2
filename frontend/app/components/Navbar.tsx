'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

useEffect(() => {
  const userData = localStorage.getItem('user')
  if (userData && userData !== 'undefined') {
    try {
      setUser(JSON.parse(userData))
    } catch (e) {
      localStorage.removeItem('user')
    }
  }
}, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/')
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-3xl">👁️</div>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              FaceSeek
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-gray-700 hover:text-indigo-600 font-semibold transition-colors">
              Pricing
            </Link>

            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 font-semibold transition-colors">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-indigo-600 font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}