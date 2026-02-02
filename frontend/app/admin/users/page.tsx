"use client";

import { useEffect, useState } from "react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Users fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string, value?: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, value }),
      });
      fetchUsers();
      setEditingUser(null);
      setCreditAmount("");
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Kullanıcılar</h1>
        <div className="text-slate-400">Toplam: {total}</div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Email veya isim ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="banned">Engelli</option>
        </select>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Kullanıcı</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Kredi</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Aramalar</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Durum</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">Kayıt</th>
                <th className="text-left px-6 py-4 text-slate-300 font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white font-medium">
                        {user.name?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{user.name || "-"}</div>
                        <div className="text-slate-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-indigo-400 font-semibold">{user.credits}</span></td>
                  <td className="px-6 py-4 text-slate-300">{user._count?.searches || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {user.status === "active" ? "Aktif" : "Engelli"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{new Date(user.createdAt).toLocaleDateString("tr-TR")}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg" title="Düzenle">✏️</button>
                      {user.status === "active" ? (
                        <button onClick={() => handleAction(user.id, "ban")} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="Engelle">🚫</button>
                      ) : (
                        <button onClick={() => handleAction(user.id, "activate")} className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg" title="Aktifleştir">✅</button>
                      )}
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg" title="Sil">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Kullanıcı Düzenle</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Email</label>
                <div className="text-white">{editingUser.email}</div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Mevcut Kredi</label>
                <div className="text-indigo-400 font-semibold">{editingUser.credits}</div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-2">Kredi Ekle/Ayarla</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Miktar"
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white"
                  />
                  <button onClick={() => handleAction(editingUser.id, "addCredits", creditAmount)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl">Ekle</button>
                  <button onClick={() => handleAction(editingUser.id, "setCredits", creditAmount)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">Ayarla</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-slate-400 hover:text-white">İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}