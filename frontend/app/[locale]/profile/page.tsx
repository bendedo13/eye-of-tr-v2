"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Loader from "@/components/Loader";
import ClientOnly from "@/components/ClientOnly";
import { changePassword, deleteAccount, getDashboardStats, updateProfile } from "@/lib/api";

/**
 * Kullanıcı Profil Sayfası
 */
import { use } from "react";

export default function ProfilePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { user, token, mounted, loading, refresh, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalSearches: 0,
    totalMatches: 0,
    lastSearch: null as string | null,
  });
  const [username, setUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState("");

  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Auth guard - kullanıcı yoksa login'e yönlendir
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [mounted, loading, user, router, locale]);

  useEffect(() => {
    if (!mounted || loading || !user) return;
    setUsername(user.username || "");
  }, [mounted, loading, user]);

  useEffect(() => {
    if (!mounted || loading || !user || !token) return;
    getDashboardStats(token)
      .then((s) => {
        setStats({
          totalSearches: s.total_searches ?? 0,
          totalMatches: s.successful_searches ?? 0,
          lastSearch: s.last_search_at ? new Date(s.last_search_at).toLocaleString() : null,
        });
      })
      .catch(() => {});
  }, [mounted, loading, user, token]);

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
              {profileError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                  {profileError}
                </div>
              )}

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800"
                  />
                  <button
                    onClick={async () => {
                      if (!token) return;
                      setProfileError("");
                      setSavingProfile(true);
                      try {
                        await updateProfile(token, username);
                        await refresh();
                      } catch (e: any) {
                        setProfileError(e.message || "Güncelleme başarısız.");
                      } finally {
                        setSavingProfile(false);
                      }
                    }}
                    disabled={savingProfile}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
                  >
                    Kaydet
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <button
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                  onClick={() => {
                    setPwError("");
                    setPwOpen(true);
                  }}
                >
                  Change Password
                </button>
              </div>

              <div className="pt-4 border-t border-gray-200">
                {deleteError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-3">
                    {deleteError}
                  </div>
                )}
                <button
                  className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-60"
                  disabled={deleteBusy}
                  onClick={async () => {
                    if (!token) return;
                    if (!confirm("Hesabınızı silmek istediğinize emin misiniz?")) return;
                    setDeleteError("");
                    setDeleteBusy(true);
                    try {
                      await deleteAccount(token);
                      logout();
                      router.push(`/${locale}/login`);
                    } catch (e: any) {
                      setDeleteError(e.message || "Silme başarısız.");
                    } finally {
                      setDeleteBusy(false);
                    }
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pwOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
            {pwError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-3 rounded-xl text-sm font-medium mb-4">
                {pwError}
              </div>
            )}
            <div className="space-y-3">
              <input
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800"
                placeholder="Current password"
              />
              <input
                type="password"
                value={pwNext}
                onChange={(e) => setPwNext(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800"
                placeholder="New password (min 8)"
              />
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800"
                placeholder="Confirm new password"
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold"
                onClick={() => {
                  setPwOpen(false);
                  setPwCurrent("");
                  setPwNext("");
                  setPwConfirm("");
                  setPwError("");
                }}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-60"
                disabled={pwBusy}
                onClick={async () => {
                  if (!token) return;
                  setPwError("");
                  if (pwNext.length < 8) {
                    setPwError("Şifre en az 8 karakter olmalı.");
                    return;
                  }
                  if (pwNext !== pwConfirm) {
                    setPwError("Şifreler eşleşmiyor.");
                    return;
                  }
                  setPwBusy(true);
                  try {
                    await changePassword(token, pwCurrent, pwNext);
                    setPwOpen(false);
                    setPwCurrent("");
                    setPwNext("");
                    setPwConfirm("");
                  } catch (e: any) {
                    setPwError(e.message || "Şifre değiştirilemedi.");
                  } finally {
                    setPwBusy(false);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientOnly>
  );
}
