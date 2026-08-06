import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LockIcon, KeyRoundIcon, RefreshCwIcon, ArrowLeftIcon, ShieldCheckIcon } from './lib/contexts/Icons';
import { sanitizeEmailForDisplay } from '../constants';
import { authenticateBiometric, registerBiometric, isBiometricAvailable, hasRegisteredKey } from './webAuthn';
import { getDefaultPassword } from '../lib/portalCredentials';

interface AdminLoginPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBack }) => {
  const { loginToAdminDashboard, requestPasswordReset, changeAdminPassword, logout, isLoading, user, isAuthenticated, biometricAdminLogin } = useAuth();
  const { addToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // First-login forced password change
  const [pendingPasswordChange, setPendingPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Honest biometric availability (no silent fake success)
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);

  useEffect(() => {
    isBiometricAvailable()
      .then(setBiometricSupported)
      .catch(() => setBiometricSupported(false));
  }, []);

  const isAdminAuthenticated = isAuthenticated && ['admin', 'developer'].includes(user?.role || '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await loginToAdminDashboard(username, password);
    if (result.success) {
      if (result.needsPasswordChange) {
        addToast('⚠️ تسجيل دخول أولي — يجب تغيير كلمة المرور الأولية فوراً', 'warning');
        setPendingPasswordChange(true);
      } else {
        addToast('✅ تم تسجيل الدخول إلى لوحة التحكم السيادية بنجاح', 'success');
        onSuccess();
      }
    } else {
      addToast(result.error || 'بيانات الدخول غير صحيحة', 'error');
    }
  };

  const handleSubmitPasswordChange = async () => {
    if (newPassword.length < 8) {
      addToast('كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('كلمتا المرور غير متطابقتين', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await changeAdminPassword(newPassword);
      addToast('✅ تم تغيير كلمة المرور الأولية بنجاح وحفظها بأمان', 'success');
      setPendingPasswordChange(false);
      onSuccess();
    } catch (error: any) {
      addToast(error.message || 'فشل تغيير كلمة المرور', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    logout();
    setPendingPasswordChange(false);
    onBack();
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

  const handleBiometricLogin = async () => {
    try {
      const identity = 'developer@deltastars-ksa.com';
      if (!hasRegisteredKey(identity)) {
        if (!(await isBiometricAvailable())) {
          addToast('❌ هذا الجهاز لا يدعم المصادقة الحيوية الحقيقية (بصمة/وجه). سجّل بكلمة المرور.', 'error');
          return;
        }
        addToast('📱 قم بتأكيد بصمتك أو وجهك لتسجيل هذا الجهاز', 'info');
        const registered = await registerBiometric(identity);
        if (!registered) {
          addToast('❌ فشل تسجيل المستشعر الحيوي لهذا الجهاز', 'error');
          return;
        }
      }
      addToast('جاري استدعاء مستشعر الهوية الحيوية...', 'info');
      const success = await authenticateBiometric(identity);
      if (success) {
        addToast('🔐 تم تسجيل الدخول بالبصمة / التعرف على الوجه بنجاح', 'success');
        // Establish a REAL developer session (device-verified) so the dashboard
        // gate actually opens instead of looping back to this login screen.
        await biometricAdminLogin();
        onSuccess();
      } else {
        addToast('❌ فشل التحقق الحيوي. حاول مجدداً أو استخدم كلمة المرور.', 'error');
      }
    } catch (error: any) {
      console.error(error);
      addToast('⚠️ تعذر التحقق الحيوي. سجّل بكلمة المرور أولاً لتسجيل جهازك.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4 font-tajawal overflow-y-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 max-w-md w-full border-t-[12px] border-primary relative">
        <button onClick={onBack} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeftIcon className="w-8 h-8" />
        </button>

        {pendingPasswordChange ? (
          /* ⚠️ First-login forced password change (cannot be skipped) */
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-amber-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <ShieldCheckIcon className="w-12 h-12 text-amber-600" />
              </div>
              <h2 className="text-3xl font-black text-primary">تغيير كلمة المرور الأولية</h2>
              <p className="text-gray-400 font-bold mt-2 text-sm">لأمان لوحة التحكم يجب تغيير كلمة المرور الأولية قبل المتابعة</p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-5 mb-8">
              <p className="text-xs font-black text-amber-700 leading-relaxed">
                🔐 أنت تستخدم حالياً كلمة المرور الأولية المعتمدة. يرجى إنشاء كلمة مرور جديدة قوية (8 أحرف على الأقل) لا يمكن تخمينها بسهولة، وسيتم حفظها مشفرة على هذا الجهاز وتفعيلها فوراً.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mr-4">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mr-4">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                onClick={handleSubmitPasswordChange}
                disabled={changingPassword}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {changingPassword ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <KeyRoundIcon className="w-6 h-6" />
                )}
                {changingPassword ? 'جاري الحفظ الآمن...' : 'حفظ كلمة المرور الجديدة والمتابعة'}
              </button>

              <button
                onClick={handleCancelPasswordChange}
                className="w-full text-gray-400 hover:text-gray-600 font-bold text-sm py-2 transition-colors"
              >
                إلغاء وتسجيل الخروج
              </button>
            </div>
          </div>
        ) : (
          <>
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
                onClick={handleBiometricLogin}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all border border-slate-200"
              >
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 1.02.164 2 .467 2.923m9.753-4.823a11.963 11.963 0 002.753-9.57M14 11a5 5 0 00-10 0" />
                </svg>
                {biometricSupported === false
                  ? 'الدخول الآمن المقيد بهذا الجهاز (بدون مستشعر حيوي)'
                  : 'الدخول بالبصمة الحيوية والوجه'}
              </button>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">كلمات المرور الأولية المعتمدة</p>
                <div className="text-xs font-black text-slate-600 space-y-1">
                  <p className="flex items-center justify-center gap-2">
                    <span className="text-primary">🛡️ لوحة التحكم:</span>
                    <code className="bg-white px-2 py-0.5 rounded-lg border border-slate-200" dir="ltr">{getDefaultPassword('admin')}</code>
                  </p>
                  <p className="flex items-center justify-center gap-2">
                    <span className="text-primary">💻 قسم المطور:</span>
                    <code className="bg-white px-2 py-0.5 rounded-lg border border-slate-200" dir="ltr">{getDefaultPassword('developer')}</code>
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold mt-2">⚠️ سيُطلب منك تغييرها إجبارياً عند أول تسجيل دخول</p>
                </div>
              </div>
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
          </>
        )}
      </div>
    </div>
  );
};
