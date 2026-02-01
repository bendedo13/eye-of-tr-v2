"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import ClientOnly from "@/components/ClientOnly";

/**
 * Kullanıcı Profil Sayfası
 */
export default function ProfilePage() {
  const { user, mounted, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSearches: 0,
    totalMatches: 0,
    lastSearch: null as string | null,
  });

  // Auth guard - kullanıcı yoksa login'e yönlendir
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push("/login");
    }
  }, [mounted, loading, user, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <Navbar />
        
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Profile Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{user.email}</h1>
                <p className="text-gray-600 mt-1">Member since {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="text-indigo-600 text-4xl mb-2">🔍</div>
              <div className="text-3xl font-bold text-gray-800">{stats.totalSearches}</div>
              <div className="text-gray-600 text-sm">Total Searches</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <div className="text-3xl font-bold text-gray-800">{stats.totalMatches}</div>
              <div className="text-gray-600 text-sm">Matches Found</div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
              <div className="text-purple-600 text-4xl mb-2">📅</div>
              <div className="text-lg font-bold text-gray-800">
                {stats.lastSearch || "No searches yet"}
              </div>
              <div className="text-gray-600 text-sm">Last Search</div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                  Change Password
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button className="text-red-600 hover:text-red-800 font-medium text-sm">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
