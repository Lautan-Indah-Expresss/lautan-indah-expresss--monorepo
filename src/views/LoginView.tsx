import React, { useState } from 'react';
import { BrandLogo } from '../components/BrandLogo';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storage';
import {
  ShieldCheck,
  Truck,
  Building2,
  KeyRound,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switch role pre-populates demo credentials
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMsg(null);
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (role === 'penerima') {
      setUsername('penerima');
      setPassword('terima123');
    } else if (role === 'sopir') {
      setUsername('sopir');
      setPassword('sopir123');
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const users = StorageService.getUsers();
    let targetUser: User | undefined;
    if (role === 'admin') targetUser = users.find((u) => u.role === 'admin');
    if (role === 'penerima') targetUser = users.find((u) => u.role === 'penerima');
    if (role === 'sopir') targetUser = users.find((u) => u.role === 'sopir');

    if (targetUser) {
      StorageService.setActiveUser(targetUser);
      onLoginSuccess(targetUser);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const users = StorageService.getUsers();
    const cleanUser = username.trim().toLowerCase();

    // Verify demo credentials
    let valid = false;
    let loggedUser: User | undefined;

    if (selectedRole === 'admin' && cleanUser === 'admin' && password === 'admin123') {
      valid = true;
      loggedUser = users.find((u) => u.role === 'admin');
    } else if (selectedRole === 'penerima' && cleanUser === 'penerima' && password === 'terima123') {
      valid = true;
      loggedUser = users.find((u) => u.role === 'penerima');
    } else if (selectedRole === 'sopir' && cleanUser === 'sopir' && password === 'sopir123') {
      valid = true;
      loggedUser = users.find((u) => u.role === 'sopir');
    }

    if (valid && loggedUser) {
      StorageService.setActiveUser(loggedUser);
      onLoginSuccess(loggedUser);
    } else {
      setErrorMsg(
        `Kombinasi username atau password untuk role ${selectedRole.toUpperCase()} salah. Gunakan akun demo di bawah.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-teal-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Background nautical ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center flex flex-col items-center">
          <BrandLogo size="xl" lightMode={true} showSubtitle={false} className="justify-center" />
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white uppercase">
            PT LAUTAN INDAH Express
          </h2>
          <p className="mt-1 text-xs text-teal-300 font-semibold uppercase tracking-wider">
            Sistem Digital Monitoring Armada &amp; Pengecekan Barang
          </p>
        </div>

        {/* Card Container */}
        <div className="mt-6 bg-white/95 backdrop-blur-md py-7 px-5 sm:px-8 shadow-2xl rounded-2xl border border-white/20 text-slate-800">
          {/* Role Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">
              Pilih Hak Akses (Role Login):
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'admin'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ADMIN</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('penerima')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'penerima'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>PENERIMA</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('sopir')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  selectedRole === 'sopir'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>SOPIR / KURIR</span>
              </button>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 text-center font-medium">
              {selectedRole === 'admin' && 'Tampilan Web Desktop: Master Monitoring, Form Muat, Selisih & Laporan'}
              {selectedRole === 'penerima' && 'Tampilan Mobile: Cek Resi/SJ, Unloading Koli, & Tanda Tangan Penerima'}
              {selectedRole === 'sopir' && 'Tampilan Mobile: Absensi Kamera GPS Watermark, Surat Jalan, & Update Status'}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Username Akun
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Kata Sandi
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  placeholder="Masukkan kata sandi"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-900 via-teal-800 to-teal-700 hover:from-blue-950 hover:to-teal-800 shadow-md transition-all cursor-pointer"
            >
              <span>Masuk Sebagai {selectedRole.toUpperCase()}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Demo Buttons for Instant Testing */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Akses Cepat Demo (1-Klik Masuk Langsung):</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[11px] font-bold text-blue-900 transition-all text-center flex flex-col items-center justify-center gap-0.5"
              >
                <span>Demo Admin</span>
                <span className="text-[9px] font-mono font-normal text-slate-500">admin/admin123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('penerima')}
                className="p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-[11px] font-bold text-emerald-900 transition-all text-center flex flex-col items-center justify-center gap-0.5"
              >
                <span>Demo Penerima</span>
                <span className="text-[9px] font-mono font-normal text-slate-500">penerima/terima123</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sopir')}
                className="p-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-[11px] font-bold text-amber-900 transition-all text-center flex flex-col items-center justify-center gap-0.5"
              >
                <span>Demo Sopir</span>
                <span className="text-[9px] font-mono font-normal text-slate-500">sopir/sopir123</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} PT LAUTAN INDAH Express. Seluruh Hak Cipta Dilindungi.</p>
          <p className="mt-0.5 text-[11px] text-teal-400/80">
            Armada Terpercaya • Cek Muat Transparan • Tracking Real-Time
          </p>
        </div>
      </div>
    </div>
  );
};
