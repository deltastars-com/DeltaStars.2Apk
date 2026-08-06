import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LockIcon, KeyRoundIcon, RefreshCwIcon, ArrowLeftIcon, ShieldCheckIcon } from './lib/contexts/Icons';
import { sanitizeEmailForDisplay } from '../constants';
import { authenticateBiometric } from './webAuthn';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBack }) => {
  const { loginToAdminDashboard, requestPasswordReset, isLoading, user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isAdminAuthenticated = isAuthenticated && ['admin', 'developer'].includes(user?.role || '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginToAdminDashboard(username, password);
    if (result.success) {
      addToast('✅ تم تسجيل الدخول إلى لوحة التحكم السيادية بنجاح', 'success');
      onSuccess();
    } else {
      addToast(result.error || 'بيانات الدخول غير صحيحة', 'error');
    }
  };

  const handleDirectLogin = () => {
    addToast('✅ تم الدخول التلقائي بصفتك مديراً معتمداً لنجوم دلتا', 'success');
    onSuccess();
  };

  const handleResetPassword = async () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    setIsResetting(true);
    try {
      const targetEmail = username.includes('@') ? username : 'marketing@deltastars-ksa.com';
      const response = await requestPasswordReset(targetEmail);
      if (response.success) {
        addToast(response.message, 'success');
        setShowResetConfirm(false);
      }
    } catch (error: any) {
      addToast(error.message || 'فشل إرسال رابط إعادة التعيين', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 font-tajawal">
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full border-t-[12px] border-primary relative">
        <button onClick={onBack} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeftIcon className="w-8 h-8" />
        </button>

        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
            <LockIcon className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-4xl font-black text-primary">لوحة التحكم العامة</h2>
          <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">نظام الإدارة السيادي</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          {isAdminAuthenticated && (
            <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <ShieldCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-green-600 uppercase tracking-widest">مدير معتمد متصل</p>
                  <p className="text-sm font-black text-green-900">{sanitizeEmailForDisplay(user?.email)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDirectLogin}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-3"
              >
                دخول مباشر للوحة التحكم
              </button>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-px bg-green-200 flex-1"></div>
                <span className="text-[10px] font-black text-green-400 uppercase">أو الدخول بحساب آخر</span>
                <div className="h-px bg-green-200 flex-1"></div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mr-4">اسم المستخدم</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
              placeholder="متجر نجوم دلتا / التقني"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mr-4">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <KeyRoundIcon className="w-6 h-6" />
            )}
            {isLoading ? 'جاري التحقق...' : 'دخول إلى لوحة التحكم'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 font-bold text-gray-400">أو تسجيل سريع وآمن</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                // Try checking dev biometric key first
                addToast('جاري استدعاء مستشعر الهوية الحيوية...', 'info');
                const success = await authenticateBiometric('developer@deltastars-ksa.com');
                if (success) {
                  addToast('🔐 تم تسجيل الدخول ببصمة الوجه / الاصبع بنجاح السيادي', 'success');
                  handleDirectLogin();
                } else {
                  addToast('❌ فشل التحقق الحيوي. يرجى الدخول بكلمة المرور أولاً لتسجيل جهازك.', 'error');
                }
              } catch (error: any) {
                console.error(error);
                addToast('⚠️ لم يتم العثور على أجهزة حيوية مسجلة مسبقاً لهذا المتصفح.', 'error');
              }
            }}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all border border-slate-200"
          >
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 1.02.164 2 .467 2.923m9.753-4.823a11.963 11.963 0 002.753-9.57M14 11a5 5 0 00-10 0" />
            </svg>
            الدخول بالبصمة الحيوية والوجه
          </button>
        </form>

        <div className="mt-8 text-center">
          {!showResetConfirm ? (
            <button
              onClick={handleResetPassword}
              className="text-sm text-primary font-bold hover:underline flex items-center justify-center gap-2 mx-auto transition-all"
            >
              <RefreshCwIcon className="w-4 h-4" /> نسيت كلمة المرور؟
            </button>
          ) : (
            <div className="space-y-4 p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-xs text-red-600 font-bold">سيتم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني المعتمد. هل أنت متأكد؟</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleResetPassword}
                  disabled={isResetting}
                  className="text-sm bg-red-600 text-white px-6 py-2 rounded-xl font-black hover:bg-red-700 transition-all"
                >
                  {isResetting ? 'جاري الإرسال...' : 'نعم، أرسل الرابط'}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="text-sm bg-white text-gray-400 px-6 py-2 rounded-xl font-black border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <LockIcon className="w-3 h-3 text-primary" />
            <span>بوابة مشفرة خاصة بالإدارة فقط</span>
          </div>
        </div>
      </div>
    </div>
  );
};
