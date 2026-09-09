import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToShop: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToShop }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const performFirebaseLogin = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setErrorMsg('');

    const formattedEmail = loginEmail.trim().toLowerCase();
    const formattedPass = loginPass.trim();

    // Check against configured admin credentials (allowing both typo variations and usernames)
    const isConfiguredAdmin = 
      (
        formattedEmail === 'thunder@mahmu5dhasan.top' || 
        formattedEmail === 'thunder@mahmudhasan.top' || 
        formattedEmail === 'thunder' || 
        formattedEmail === 'admin' ||
        formattedEmail.includes('thunder') ||
        formattedEmail.includes('mahmudhasan') ||
        formattedEmail.includes('mahmu5dhasan')
      ) &&
      formattedPass === 'sam@thunder@095';

    if (isConfiguredAdmin) {
      setIsLoading(false);
      localStorage.setItem('arishten_admin_auth', 'true');
      try {
        const emailToAuth = formattedEmail.includes('@') ? formattedEmail : 'thunder@mahmudhasan.top';
        signInWithEmailAndPassword(auth, emailToAuth, formattedPass).catch(() => {
          createUserWithEmailAndPassword(auth, emailToAuth, formattedPass).catch(() => {});
        });
      } catch (e) {}
      onLoginSuccess();
      return;
    }

    try {
      // 1. Try Firebase Auth sign-in
      const emailToAuth = formattedEmail.includes('@') ? formattedEmail : `${formattedEmail}@mahmudhasan.top`;
      await signInWithEmailAndPassword(auth, emailToAuth, formattedPass);
      setIsLoading(false);
      localStorage.setItem('arishten_admin_auth', 'true');
      onLoginSuccess();
      return;
    } catch (err: any) {
      console.warn('[AUTH ATTEMPT]', err?.code, err?.message);

      // Handle user-not-found for initial admin setup if database is fresh
      if (err?.code === 'auth/user-not-found') {
        try {
          const emailToAuth = formattedEmail.includes('@') ? formattedEmail : `${formattedEmail}@mahmudhasan.top`;
          await createUserWithEmailAndPassword(auth, emailToAuth, formattedPass);
          setIsLoading(false);
          localStorage.setItem('arishten_admin_auth', 'true');
          onLoginSuccess();
          return;
        } catch (createErr: any) {
          // Continue to error display
        }
      }

      setIsLoading(false);
      
      if (err?.code === 'auth/invalid-email') {
        setErrorMsg('সঠিক ইমেইল ফরম্যাট প্রদান করুন।');
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMsg('ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। সঠিক তথ্য প্রদান করুন।');
      } else if (err?.code === 'auth/too-many-requests') {
        setErrorMsg('অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।');
      } else if (err?.code === 'auth/operation-not-allowed' || err?.code === 'auth/configuration-not-found') {
        setErrorMsg('অথেনটিকেশন সার্ভিস প্রস্তুত নয়। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
      } else {
        setErrorMsg('লগইন ব্যর্থ হয়েছে। আপনার ইমেইল ও পাসওয়ার্ড যাচাই করুন।');
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('ইমেইল এবং পাসওয়ার্ড আবশ্যক');
      return;
    }
    performFirebaseLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden font-sans">
      {/* Background glowing ambient light */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-tr from-blue-600 to-emerald-600 text-white font-black text-3xl shadow-xl shadow-blue-900/40 mb-3">
            A
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>Arishten</span>
            <span className="text-xs uppercase bg-blue-600 text-white px-2 py-0.5 rounded-md font-mono tracking-wider font-semibold">
              Admin
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            সুরক্ষিত অ্যাডমিন ম্যানেজমেন্ট পোর্টাল
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-bold">ত্রুটি:</span> {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                অ্যাডমিন ইমেইল
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="thunder@mahmudhasan.top"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-gray-900"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  পাসওয়ার্ড
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-gray-900"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title={showPassword ? 'পাসওয়ার্ড লুকিয়ে রাখুন' : 'পাসওয়ার্ড দেখুন'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>এই ব্রাউজারে লগইন মনে রাখুন</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Card Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Protected Admin Access
          </span>
          <button
            onClick={onBackToShop}
            className="text-gray-700 hover:text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            দোকানে ফিরে যান
          </button>
        </div>
      </div>
    </div>
  );
};

