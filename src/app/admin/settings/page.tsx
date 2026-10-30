"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  KeyRound,
  Users,
  UserPlus,
  Lock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Edit2,
  Info,
} from "lucide-react";

interface AdminUser {
  id: number;
  name: string;
  username: string;
  role: "spradmexp" | "admexp" | "driver";
  is_active: boolean;
  created_at: string;
}

const DEFAULT_ADMIN_PASSWORD = "Adminlautanindahexp";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [activeTab, setActiveTab] = useState<"password" | "users">("password");

  // Form Change Password (Akun Sendiri)
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Super Admin: List Users & Modals
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form Create User
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admexp" | "spradmexp">("admexp");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal & Form Edit User (Khusus Super Admin)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admexp" | "spradmexp">("admexp");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Ambil info akun yang sedang login
  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMe(false);
    }
  };

  // Ambil daftar admin (hanya jika super admin)
  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success && data.data) {
        setAdminList(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (currentUser?.role === "spradmexp" && activeTab === "users") {
      fetchAdmins();
    }
  }, [currentUser, activeTab]);

  // Handler Ganti Kata Sandi (Mandiri)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassError("Semua bidang kata sandi wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setPassError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setPassSubmitting(true);
    try {
      const res = await fetch("/api/admin/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah kata sandi.");
      }

      setPassSuccess(data.message || "Kata sandi berhasil diperbarui!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassError(err.message || "Terjadi kesalahan.");
    } finally {
      setPassSubmitting(false);
    }
  };

  // Handler Tambah Admin Baru
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newAdminName || !newAdminUsername) {
      setCreateError("Harap isi nama dan username.");
      return;
    }

    setCreateSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdminName,
          username: newAdminUsername,
          password: newAdminPassword.trim() || DEFAULT_ADMIN_PASSWORD,
          role: newAdminRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat user admin baru.");
      }

      setNewAdminName("");
      setNewAdminUsername("");
      setNewAdminPassword("");
      setNewAdminRole("admexp");
      setShowCreateModal(false);
      fetchAdmins();
    } catch (err: any) {
      setCreateError(err.message || "Terjadi kesalahan.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handler Buka Modal Edit User
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPassword("");
    setEditRole(user.role === "spradmexp" ? "spradmexp" : "admexp");
    setEditError(null);
  };

  // Handler Submit Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    setEditSubmitting(true);
    try {
      const body: any = {
        userId: editingUser.id,
        name: editName,
        username: editUsername,
        role: editRole,
      };

      if (editPassword.trim()) {
        body.newPassword = editPassword.trim();
      }

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui akun user.");
      }

      setEditingUser(null);
      fetchAdmins();
      if (editingUser.id === currentUser?.id) {
        fetchMe();
      }
    } catch (err: any) {
      setEditError(err.message || "Terjadi kesalahan.");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handler Toggle Status Aktif Admin
  const handleToggleStatus = async (user: AdminUser) => {
    const actionText = user.is_active ? "menonaktifkan" : "mengaktifkan";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} akun ${user.username}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          isActive: !user.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengubah status.");
      } else {
        fetchAdmins();
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  const isSuperAdmin = currentUser?.role === "spradmexp";

  if (loadingMe) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bersih Tanpa Badge Berlebihan */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pengaturan Akun & Keamanan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kata sandi akun dan manajemen staf administrator ekspedisi.
            </p>
          </div>
        </div>

        {/* Info Nama Pengguna Aktif */}
        {currentUser && (
          <div className="text-right">
            <div className="text-xs font-bold text-slate-800">{currentUser.name}</div>
            <div className="text-[11px] font-mono text-slate-500 uppercase">{currentUser.role}</div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "password"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Ubah Kata Sandi Saya</span>
        </button>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "users"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen User Admin ({adminList.length || "•"})</span>
          </button>
        )}
      </div>

      {/* TAB 1: UBAH KATA SANDI SAYA */}
      {activeTab === "password" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-xl">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Perbarui Kata Sandi Akun</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kombinasi minimal 6 karakter untuk menjaga keamanan akun Anda.
            </p>
          </div>

          {passError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-semibold">{passError}</p>
            </div>
          )}

          {passSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 font-semibold">{passSuccess}</p>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi Lama Saat Ini
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama..."
                  required
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  required
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru..."
                required
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {passSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Sandi Baru...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan Kata Sandi</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAJEMEN USER ADMIN (KHUSUS spradmexp) */}
      {isSuperAdmin && activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Daftar Akun Administrator Ekspedisi</h2>
              <p className="text-xs text-slate-500">
                Kelola akun staf operasional (<span className="text-blue-600 font-mono font-bold">admexp</span>) dan hak akses sistem.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setShowCreateModal(true);
              }}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah User Admin Baru</span>
            </button>
          </div>

          {/* Tabel Admin */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Username Login</th>
                    <th className="py-3 px-4">Role Kode</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingAdmins ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Memuat data administrator...
                      </td>
                    </tr>
                  ) : adminList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada data admin terdaftar.
                      </td>
                    </tr>
                  ) : (
                    adminList.map((adm) => {
                      const isSelf = adm.id === currentUser?.id;
                      return (
                        <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {adm.name}
                            {isSelf && (
                              <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-normal">
                                Anda
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            {adm.username}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                adm.role === "spradmexp"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {adm.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {adm.is_active ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                Dinonaktifkan
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Tombol Edit User / Reset Password */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(adm)}
                                className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1"
                                title="Edit data atau ganti password user ini"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Edit</span>
                              </button>

                              {/* Tombol Toggle Aktif/Nonaktif */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(adm)}
                                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                    adm.is_active
                                      ? "text-red-600 border-red-200 hover:bg-red-50"
                                      : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                  }`}
                                >
                                  {adm.is_active ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH ADMIN BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Buat Akun Administrator Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Akun baru dapat langsung digunakan untuk login ke portal web ekspedisi.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Username Login
                </label>
                <input
                  type="text"
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  placeholder="Contoh: budi_ops"
                  required
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Kata Sandi Awal
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">Opsional (ada default)</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder={DEFAULT_ADMIN_PASSWORD}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    Jika dikosongkan, kata sandi otomatis: <strong className="font-mono text-slate-800">{DEFAULT_ADMIN_PASSWORD}</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tingkat Akses (Role)
                </label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="admexp">admexp (Admin Operasional Biasa)</option>
                  <option value="spradmexp">spradmexp (Super Admin Penuh)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Buat Akun</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT USER & RESET PASSWORD (SUPER ADMIN) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Edit Pengguna / Ganti Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui profil atau reset kata sandi akun <strong className="font-mono text-slate-800">{editingUser.username}</strong> jika staf lupa password.
            </p>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  required
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Reset Kata Sandi Baru
                  </label>
                  <span className="text-[10px] text-slate-400">Kosongkan jika tidak diganti</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Masukkan sandi baru jika lupa..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setEditPassword(DEFAULT_ADMIN_PASSWORD)}
                    className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Gunakan Default: {DEFAULT_ADMIN_PASSWORD}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tingkat Akses (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="admexp">admexp (Admin Operasional Biasa)</option>
                  <option value="spradmexp">spradmexp (Super Admin Penuh)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
