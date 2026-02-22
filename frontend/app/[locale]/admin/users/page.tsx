"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Activity, Download, Filter, Pencil, Search, Users } from "lucide-react";
import { adminGetUserSearches, adminGetUserSearchStats, adminListUsers, adminUpdateUser } from "@/lib/adminApi";
import Modal from "@/components/Modal";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 25;
const SEARCH_PAGE_SIZE = 50;

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [activityUser, setActivityUser] = useState<any | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityStatus, setActivityStatus] = useState("all");
  const [activityPage, setActivityPage] = useState(1);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [searches, setSearches] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    const adminKey = localStorage.getItem("adminKey") || "";
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await adminListUsers(adminKey, {
          q: searchQuery || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
          offset: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
        });
        const items = data.items || [];
        setUsers(items);
        setHasMore(items.length === PAGE_SIZE);
      } catch (error: any) {
        toast.error(error?.message || "Kullanıcılar yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [searchQuery, statusFilter, page]);

  useEffect(() => {
    if (!activityUser) return;
    const adminKey = localStorage.getItem("adminKey") || "";
    const loadActivity = async (replace = true) => {
      try {
        setActivityLoading(true);
        const [statsRes, searchesRes] = await Promise.all([
          adminGetUserSearchStats(adminKey, activityUser.id),
          adminGetUserSearches(adminKey, activityUser.id, {
            status: activityStatus === "all" ? undefined : activityStatus,
            offset: (activityPage - 1) * SEARCH_PAGE_SIZE,
            limit: SEARCH_PAGE_SIZE,
          }),
        ]);
        setStats(statsRes);
        const items = searchesRes.items || [];
        setSearches((prev) => (replace ? items : [...prev, ...items]));
        setActivityHasMore(items.length === SEARCH_PAGE_SIZE);
      } catch (error: any) {
        toast.error(error?.message || "Aktivite verileri yüklenemedi");
      } finally {
        setActivityLoading(false);
      }
    };
    loadActivity(activityPage === 1);
  }, [activityUser, activityStatus, activityPage]);

  const sortedUsers = useMemo(() => {
    const sorted = [...users];
    sorted.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const av = a?.[sortKey];
      const bv = b?.[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1 * dir;
      if (bv == null) return -1 * dir;
      if (sortKey.includes("date") || sortKey.includes("at")) {
        return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
      }
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
    return sorted;
  }, [users, sortDir, sortKey]);

  const formatDateTime = (value: any) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString("tr-TR");
    } catch {
      return "-";
    }
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      email: user.email || "",
      username: user.username || "",
      full_name: user.full_name || "",
      phone: user.phone || "",
      address: user.address || "",
      credits: user.credits ?? 0,
      credits_delta: 0,
      reset_credits: false,
      is_active: !!user.is_active,
      role: user.role || "user",
      tier: user.tier || "free",
      credit_limit: user.credit_limit ?? "",
    });
  };

  const saveUser = async () => {
    if (!editUser || !editForm) return;
    try {
      setSaving(true);
      const adminKey = localStorage.getItem("adminKey") || "";
      const patch: any = {
        email: editForm.email,
        username: editForm.username,
        full_name: editForm.full_name,
        phone: editForm.phone,
        address: editForm.address,
        is_active: editForm.is_active,
        role: editForm.role,
        tier: editForm.tier,
        credit_limit: editForm.credit_limit,
      };
      if (editForm.reset_credits) patch.reset_credits = true;
      if (editForm.credits_delta && Number(editForm.credits_delta) !== 0) {
        patch.credits_delta = Number(editForm.credits_delta);
      }
      if (editForm.credits !== "" && editForm.credits != null) {
        patch.credits = Number(editForm.credits);
      }
      await adminUpdateUser(adminKey, editUser.id, patch);
      toast.success("Kullanıcı güncellendi");
      setEditUser(null);
      setEditForm(null);
      setPage(1);
      const data = await adminListUsers(adminKey, {
        q: searchQuery || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        offset: 0,
        limit: PAGE_SIZE,
      });
      const items = data.items || [];
      setUsers(items);
      setHasMore(items.length === PAGE_SIZE);
    } catch (error: any) {
      toast.error(error?.message || "Kullanıcı güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  const downloadCsv = (rows: any[], filename: string, headers: string[], rowMapper: (row: any) => string[]) => {
    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        rowMapper(row)
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportUsers = () => {
    downloadCsv(
      sortedUsers,
      "kullanicilar.csv",
      ["ID", "Ad Soyad", "Email", "Kullanıcı Adı", "Kredi", "Durum", "Kayıt", "Son Giriş"],
      (u) => [
        u.id,
        u.full_name || "",
        u.email,
        u.username || "",
        u.credits ?? 0,
        u.is_active ? "Aktif" : "Pasif",
        formatDateTime(u.created_at),
        formatDateTime(u.last_seen_at),
      ]
    );
  };

  const exportSearches = () => {
    downloadCsv(
      searches,
      "arama_gecmisi.csv",
      ["Tarih", "Arama", "Tür", "Süre(ms)", "Durum", "Sonuç"],
      (s) => [
        formatDateTime(s.created_at),
        s.query || s.file_name || "",
        s.search_type || "",
        s.search_duration_ms ?? "",
        s.is_successful ? "Başarılı" : "Başarısız",
        s.results_found ?? "",
      ]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">
            KULLANICI <span className="text-zinc-700">YÖNETİMİ</span>
          </h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <Users size={12} /> Sistem kullanıcılarını yönet
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportUsers}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all text-xs font-black uppercase"
          >
            <Download size={16} /> İndir
          </button>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="disabled">Pasif</option>
            </select>
          </div>
          <div className="flex gap-3">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="flex-1 px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
            >
              <option value="created_at">Kayıt Tarihi</option>
              <option value="last_seen_at">Son Giriş</option>
              <option value="credits">Kredi</option>
              <option value="email">Email</option>
              <option value="id">ID</option>
            </select>
            <select
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value)}
              className="px-4 py-3 bg-black/40 border border-white/5 rounded-lg text-white focus:outline-none focus:border-primary/50"
            >
              <option value="desc">Azalan</option>
              <option value="asc">Artan</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">ID</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Ad Soyad</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Email</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Kredi</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Durum</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Kayıt</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">Son Giriş</th>
                  <th className="text-left py-4 px-4 font-black text-zinc-500 uppercase text-[10px] tracking-widest">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 text-white">{user.id}</td>
                    <td className="py-4 px-4 text-zinc-400">{user.full_name || "-"}</td>
                    <td className="py-4 px-4 text-white">{user.email}</td>
                    <td className="py-4 px-4 text-primary font-black">{user.credits}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          user.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {user.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-500 text-xs">{formatDateTime(user.created_at)}</td>
                    <td className="py-4 px-4 text-zinc-500 text-xs">{formatDateTime(user.last_seen_at)}</td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary/40 text-xs"
                        >
                          <Pencil size={14} /> Düzenle
                        </button>
                        <button
                          onClick={() => {
                            setActivityUser(user);
                            setActivityStatus("all");
                            setActivityPage(1);
                            setSearches([]);
                            setStats(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary/40 text-xs"
                        >
                          <Activity size={14} /> Aktivite
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-zinc-500">Sayfa {page}</div>
          <div className="flex gap-3">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 text-xs font-black uppercase rounded-lg border border-white/10 text-zinc-300 hover:border-primary/40"
              disabled={page === 1}
            >
              Önceki
            </button>
            <button
              onClick={() => hasMore && setPage((prev) => prev + 1)}
              className="px-4 py-2 text-xs font-black uppercase rounded-lg border border-white/10 text-zinc-300 hover:border-primary/40"
              disabled={!hasMore}
            >
              Sonraki
            </button>
          </div>
        </div>
      </GlassCard>

      <Modal isOpen={!!editUser} onClose={() => setEditUser(null)} title="Kullanıcı Düzenle" size="lg">
        {editForm && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Ad Soyad</label>
                <input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Telefon</label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Kullanıcı Adı</label>
                <input
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold uppercase text-zinc-500">Adres</label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Kredi Bakiye</label>
                <input
                  type="number"
                  value={editForm.credits}
                  onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Kredi Ekle/Çıkar</label>
                <input
                  type="number"
                  value={editForm.credits_delta}
                  onChange={(e) => setEditForm({ ...editForm, credits_delta: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Kredi Limiti</label>
                <input
                  type="number"
                  value={editForm.credit_limit}
                  onChange={(e) => setEditForm({ ...editForm, credit_limit: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Rol</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Paket</label>
                <select
                  value={editForm.tier}
                  onChange={(e) => setEditForm({ ...editForm, tier: e.target.value })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500">Durum</label>
                <select
                  value={editForm.is_active ? "active" : "disabled"}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "active" })}
                  className="mt-2 w-full px-4 py-3 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900"
                >
                  <option value="active">Aktif</option>
                  <option value="disabled">Pasif</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editForm.reset_credits}
                onChange={(e) => setEditForm({ ...editForm, reset_credits: e.target.checked })}
              />
              <span className="text-sm text-zinc-700">Kredileri sıfırla</span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={saveUser}
                className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold"
                disabled={saving}
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!activityUser} onClose={() => setActivityUser(null)} title="Kullanıcı Aktivitesi" size="xl">
        {activityUser && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-lg font-bold text-zinc-900">{activityUser.full_name || activityUser.username || activityUser.email}</div>
                <div className="text-xs text-zinc-500">{activityUser.email}</div>
              </div>
              <div className="flex gap-3">
                <select
                  value={activityStatus}
                  onChange={(e) => {
                    setActivityStatus(e.target.value);
                    setActivityPage(1);
                  }}
                  className="px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-sm"
                >
                  <option value="all">Tüm Aramalar</option>
                  <option value="success">Başarılı</option>
                  <option value="failed">Başarısız</option>
                </select>
                <button
                  onClick={exportSearches}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold uppercase"
                >
                  <Download size={14} /> CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs uppercase text-zinc-500 font-bold">Toplam Arama</div>
                <div className="text-2xl font-black text-zinc-900">{stats?.total_searches ?? "-"}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs uppercase text-zinc-500 font-bold">Başarılı Arama</div>
                <div className="text-2xl font-black text-zinc-900">{stats?.successful_searches ?? "-"}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-xs uppercase text-zinc-500 font-bold">Ortalama Süre</div>
                <div className="text-2xl font-black text-zinc-900">
                  {stats?.avg_duration_ms != null ? `${Math.round(stats.avg_duration_ms)} ms` : "-"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white">
              <div className="px-4 py-3 border-b border-zinc-200 text-xs font-bold uppercase text-zinc-500">En Çok Arananlar</div>
              <div className="p-4 space-y-2 text-sm text-zinc-700">
                {(stats?.top_queries || []).length === 0 && <div>Veri yok</div>}
                {(stats?.top_queries || []).map((q: any, idx: number) => (
                  <div key={`${q.query}-${idx}`} className="flex items-center justify-between">
                    <span>{q.query}</span>
                    <span className="font-bold text-zinc-900">{q.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white">
              <div className="px-4 py-3 border-b border-zinc-200 text-xs font-bold uppercase text-zinc-500">Arama Geçmişi</div>
              <div className="p-4 space-y-3">
                {activityLoading && <div className="text-sm text-zinc-500">Yükleniyor...</div>}
                {!activityLoading && searches.length === 0 && <div className="text-sm text-zinc-500">Kayıt yok</div>}
                {!activityLoading &&
                  searches.map((s) => (
                    <div key={s.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
                      <div className="text-zinc-500">{formatDateTime(s.created_at)}</div>
                      <div className="text-zinc-900 font-semibold md:col-span-2">{s.query || s.file_name || "-"}</div>
                      <div className="text-zinc-500">{s.search_duration_ms ? `${s.search_duration_ms} ms` : "-"}</div>
                      <div className={s.is_successful ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                        {s.is_successful ? "Başarılı" : "Başarısız"}
                      </div>
                    </div>
                  ))}
              </div>
              <div className="px-4 py-3 border-t border-zinc-200 flex justify-end">
                <button
                  onClick={() => activityHasMore && setActivityPage((prev) => prev + 1)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-600 text-xs font-semibold uppercase"
                  disabled={!activityHasMore}
                >
                  Daha Fazla
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
