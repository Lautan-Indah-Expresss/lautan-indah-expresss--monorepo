"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  KeyRound,
  Users,
  UserPlus,
  Lock,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  RefreshCw,
} from "lucide-react";

interface AdminUser {
  id: number;
  name: string;
  username: string;
  phone: string;
  role: "spradmexp" | "admexp" | "driver";
  is_active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [activeTab, setActiveTab] = useState<"password" | "users">("password");

  // Form Change Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Super Admin: List Users & Create User
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form Create User
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<"admexp" | "spradmexp">("admexp");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

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

  // Handler Ganti Kata Sandi
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
    setCreateSuccess(null);

    if (!newAdminName || !newAdminUsername || !newAdminPassword || !newAdminPhone) {
      setCreateError("Harap isi semua kolom pendaftaran akun admin.");
      return;
    }

    if (newAdminPassword.length < 6) {
      setCreateError("Kata sandi minimal 6 karakter.");
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
          password: newAdminPassword,
          phone: newAdminPhone,
          role: newAdminRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat user admin baru.");
      }

      setCreateSuccess(data.message || "Admin baru berhasil ditambahkan!");
      setNewAdminName("");
      setNewAdminUsername("");
      setNewAdminPassword("");
      setNewAdminPhone("");
      setNewAdminRole("admexp");
      setShowCreateModal(false);
      fetchAdmins();
    } catch (err: any) {
      setCreateError(err.message || "Terjadi kesalahan.");
    } finally {
      setCreateSubmitting(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Pengaturan Akun & Keamanan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola kredensial login Anda dan hak akses administratif sistem ekspedisi.
            </p>
          </div>
        </div>

        {/* Current User Badge */}
        {currentUser && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                isSuperAdmin ? "bg-amber-500 animate-pulse" : "bg-blue-600"
              }`}
            />
            <span className="font-semibold">{currentUser.name}</span>
            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-800 uppercase">
              {currentUser.role}
            </span>
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

      {/* TAB 1: UBAH KATA SANDI */}
      {activeTab === "password" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-xl">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Perbarui Kata Sandi Akun</h2>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan kombinasi minimal 6 karakter. Sangat disarankan mengganti kata sandi bawaan default saat sistem pertama kali digunakan.
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
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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
                Sebagai <strong className="text-amber-600 font-mono">spradmexp</strong>, Anda berwenang membuat dan mengelola akun staf operasional (<strong className="text-blue-600 font-mono">admexp</strong>).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateSuccess(null);
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
                    <th className="py-3 px-4">Nomor HP</th>
                    <th className="py-3 px-4">Role Kode</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingAdmins ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Memuat data administrator...
                      </td>
                    </tr>
                  ) : adminList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
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
                          <td className="py-3.5 px-4 text-slate-600">
                            {adm.phone || "-"}
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
                            {!isSelf ? (
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
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Akun Utama</span>
                            )}
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

      {/* MODAL TAMBAH ADMIN BARU */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Buat Akun Administrator Baru
            </h3>
            <p className="text-xs text-slate-500 mb-5">
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
                  Nama Staf / Administrator
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Sandi Awal
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimal 6 karakter..."
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
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
    </div>
  );
}
