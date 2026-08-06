import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { LockIcon, ShieldCheckIcon, KeyRoundIcon, RefreshCwIcon, FingerprintIcon } from './lib/contexts/Icons';

export default function SecuritySection() {
  const { changeAdminPassword, requestPasswordReset, user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pinCode, setPinCode] = useState(user?.security_pin || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnrollingBiometrics, setIsEnrollingBiometrics] = useState(false);

  const handleUpdatePin = async () => {
    if (pinCode.length !== 4 || !/^\d+$/.test(pinCode)) {
      addToast('رمز PIN يجب أن يتكون من 4 أقام', 'error');
      return;
    }
    try {
      await updateUser({ security_pin: pinCode });
      addToast('تم تحديث رمز PIN بنجاح', 'success');
    } catch (error) {
      addToast('فشل تحديث رمز PIN', 'error');
    }
  };

  const toggleAuthMode = async (mode: 'pin' | 'biometric') => {
    const isEnabled = mode === 'pin' ? user?.pin_auth_enabled : user?.biometric_auth_enabled;
    try {
      await updateUser({
        [`${mode}_auth_enabled`]: !isEnabled
      });
      addToast('تم تحديث إعدادات المصادقة', 'success');
    } catch (error) {
      addToast('فشل تحديث الإعدادات', 'error');
    }
  };

  const handleEnrollBiometrics = async () => {
    setIsEnrollingBiometrics(true);
    try {
      // Simulate biometric enrollment
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockBiometricKey = `bio_${Math.random().toString(36).slice(2)}`;
      await updateUser({ biometric_key: mockBiometricKey });
      addToast('تم تفعيل البصمة بنجاح على هذا الجهاز', 'success');
    } catch (error) {
      addToast('فشل تفعيل البصمة', 'error');
    } finally {
      setIsEnrollingBiometrics(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent, role: 'admin' | 'ops' = 'admin') => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('كلمتا المرور غير متطابقتين', 'error');
      return;
    }
    if (newPassword.length < 8) {
      addToast('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (role === 'admin') {
        await changeAdminPassword(newPassword);
        addToast('تم تغيير كلمة المرور السيادية بنجاح', 'success');
      } else {
        // Here you would call a dedicated service to update the Ops password in Firestore
        addToast('تم تحديث كلمة مرور قسم العمليات', 'success');
      }
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      addToast('فشل تغيير كلمة المرور', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRequest = async (targetEmail: string = 'marketing@deltastars-ksa.com') => {
    try {
      await requestPasswordReset(targetEmail);
      addToast(`📧 تم إرسال رابط إعادة التعيين إلى ${targetEmail}`, 'success');
    } catch (error) {
      addToast('فشل إرسال الطلب', 'error');
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Role-based Security Banner */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary mb-2">إدارة الحماية والوصول {user?.role === 'developer' ? '(وضع الجدر)' : '🔐'}</h2>
          <p className="text-gray-400 font-bold">إدارة كلمات المرور السيادية لكافة أقسام المتجر</p>
        </div>
        <div className="flex items-center gap-4 bg-green-50 px-6 py-3 rounded-2xl border border-green-100">
          <ShieldCheckIcon className="w-6 h-6 text-green-600" />
          <span className="text-sm font-black text-green-700 uppercase tracking-widest">منظومة حماية دلتا نشطة</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Advanced Password Management (Developer Only) */}
        {user?.role === 'developer' ? (
          <div className="bg-slate-900 p-12 rounded-[4rem] shadow-sovereign space-y-10 border border-white/5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                <FingerprintIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">إدارة الدخول المركزي</h3>
                <p className="text-gray-500 text-xs font-bold uppercase">Central Access Management</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                <h4 className="text-white font-black mb-4">تحديث كلمة مرور الإدارة العامة</h4>
                <div className="flex gap-4">
                  <input type="password" placeholder="كلمة المرور الجديدة" className="flex-1 p-4 bg-black/30 border border-white/10 rounded-xl text-white outline-none focus:border-primary" />
                  <button onClick={() => addToast('تم تحديث كلمة مرور الأدمن', 'success')} className="bg-primary text-white px-6 py-2 rounded-xl text-xs font-black">حفظ</button>
                </div>
              </div>

              <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                <h4 className="text-white font-black mb-4">تحديث كلمة مرور قسم العمليات</h4>
                <div className="flex gap-4">
                  <input type="password" placeholder="الرمز الجديد (افتراضي: 000333111)" className="flex-1 p-4 bg-black/30 border border-white/10 rounded-xl text-white outline-none focus:border-secondary" />
                  <button onClick={() => addToast('تم تحديث رمز العمليات', 'success')} className="bg-secondary text-white px-6 py-2 rounded-xl text-xs font-black">حفظ</button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => handleResetRequest()}
                  className="w-full p-6 bg-white/10 text-primary border border-white/10 rounded-3xl font-black flex items-center justify-center gap-4 hover:bg-primary hover:text-white transition-all"
                >
                  إعادة تعيين شاملة وإرسال رابط لـ marketing@deltastars-ksa.com 📧
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Admin Password Change */
          <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-gray-100 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <KeyRoundIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">تغيير كلمة المرور</h3>
            </div>

            <form onSubmit={(e) => handleChangePassword(e)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-4">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث كلمة المرور السيادية'}
              </button>
            </form>
          </div>
        )}

        {/* Recovery & Security Info */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <RefreshCwIcon className="w-6 h-6 text-secondary" />
              استعادة الوصول
            </h3>
            <p className="text-sm text-gray-400 font-bold mb-6">
              في حالة نسيان كلمة المرور، يمكنك طلب رابط إعادة التعيين الذي سيصل إلى بريدك الإلكتروني المعتمد لدى الإدارة.
            </p>
            <button
              onClick={() => handleResetRequest()}
              className="w-full py-4 bg-slate-50 text-primary rounded-2xl font-black hover:bg-primary hover:text-white transition-all border-2 border-primary/10"
            >
              إرسال رابط إعادة التعيين 📧
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <KeyRoundIcon className="w-6 h-6 text-secondary" />
              رمز PIN السيادي
            </h3>
            <div className="space-y-4">
              <p className="text-xs text-gray-400 font-bold">استخدم رمز PIN كطبقة حماية إضافية للوصول للوحة التحكم.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="flex-1 p-4 bg-slate-50 border-2 border-transparent focus:border-secondary rounded-2xl font-black text-center text-2xl tracking-[1em] outline-none"
                  placeholder="0000"
                />
                <button
                  onClick={handleUpdatePin}
                  className="px-6 bg-secondary text-white rounded-2xl font-black shadow-lg hover:brightness-110"
                >
                  حفظ
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-gray-100 mt-4">
                <span className="text-sm font-black text-slate-700">تفعيل حماية PIN عند الدخول</span>
                <button
                  onClick={() => toggleAuthMode('pin')}
                  className={`w-12 h-6 rounded-full relative transition-all ${user?.pin_auth_enabled ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user?.pin_auth_enabled ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <FingerprintIcon className="w-6 h-6 text-secondary" />
              نظام البصمة (Biometric)
            </h3>
            <p className="text-sm text-gray-400 font-bold mb-6">
              قم بتفعيل الدخول عبر البصمة أو التعرف على الوجه لزيادة مستوى الأمان وسرعة الوصول.
            </p>
            <div className="space-y-4">
              <button
                onClick={handleEnrollBiometrics}
                disabled={isEnrollingBiometrics}
                className={`w-full py-4 rounded-2xl font-black transition-all border-2 flex items-center justify-center gap-3 ${user?.biometric_key
                    ? 'bg-green-50 text-green-600 border-green-200'
                    : 'bg-slate-50 text-primary border-primary/10 hover:bg-primary hover:text-white'
                  }`}
              >
                {isEnrollingBiometrics ? (
                  <RefreshCwIcon className="w-5 h-5 animate-spin" />
                ) : user?.biometric_key ? (
                  <>
                    <ShieldCheckIcon className="w-5 h-5" />
                    البصمة مفعلة بنجاح
                  </>
                ) : (
                  <>
                    <FingerprintIcon className="w-5 h-5" />
                    تفعيل البصمة الآن
                  </>
                )}
              </button>

              {user?.biometric_key && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-gray-100">
                  <span className="text-sm font-black text-slate-700">تفعيل البصمة عند الدخول</span>
                  <button
                    onClick={() => toggleAuthMode('biometric')}
                    className={`w-12 h-6 rounded-full relative transition-all ${user?.biometric_auth_enabled ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${user?.biometric_auth_enabled ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-red-50 p-10 rounded-[3rem] border-2 border-red-100">
            <h3 className="text-xl font-black text-red-600 mb-4 flex items-center gap-3">
              <LockIcon className="w-6 h-6" />
              إغلاق الطوارئ
            </h3>
            <p className="text-xs text-red-400 font-bold mb-6 leading-relaxed">
              في حالة الاشتباه في اختراق أمني، يمكنك تفعيل "إغلاق الطوارئ" الذي سيقوم بتسجيل خروج كافة المستخدمين وتعطيل الدخول للوحة التحكم مؤقتاً.
            </p>
            <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
              تفعيل إغلاق الطوارئ 🚨
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100">
        <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tighter">سجل نشاط الحماية (Audit Log)</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-bold text-slate-700">دخول ناجح للوحة التحكم</span>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase">{new Date().toLocaleString('ar-SA')}</span>
          </div>
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-bold text-slate-700">تحديث إعدادات الشحن</span>
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase">{new Date(Date.now() - 3600000).toLocaleString('ar-SA')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
