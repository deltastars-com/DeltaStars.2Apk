import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast, useI18n } from './lib/contexts';
import { UserIcon, LockIcon, ArrowRightIcon, ShieldCheckIcon, TruckIcon } from './lib/contexts/Icons';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigate: (page: string, params?: any) => void;
}

export function LoginPage({ onLoginSuccess, onNavigate }: LoginPageProps) {
  const { language } = useI18n();
  const { loginWithEmail, isLoading } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      addToast(language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully', 'success');
      onLoginSuccess();
    } catch (error: any) {
      addToast(language === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials', 'error');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 font-tajawal">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left Side: General Login */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-2xl border-t-8 border-primary relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-primary mb-2">
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </h2>
            <p className="text-gray-400 font-bold mb-8 uppercase tracking-widest text-xs">Access Your Account</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block px-2">
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block px-2">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? '...' : (language === 'ar' ? 'دخول 🔑' : 'Sign In 🔑')}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Right Side: Quick Portals */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="text-center md:text-right mb-4">
            <h3 className="text-2xl font-black text-gray-800">
              {language === 'ar' ? 'البوابات المتخصصة' : 'Specialized Portals'}
            </h3>
            <p className="text-gray-400 font-bold text-sm">أختر البوابة المناسبة لنوع حسابك</p>
          </div>

          <QuickPortalCard 
            icon={<ShieldCheckIcon className="w-8 h-8" />}
            title={language === 'ar' ? 'بوابة كبار العملاء VIP' : 'VIP Sovereign Portal'}
            description={language === 'ar' ? 'الدخول عبر الجوال والبصمة' : 'Access via Phone & Biometrics'}
            onClick={() => onNavigate('vip_login')}
            color="bg-amber-500"
          />

          <QuickPortalCard 
            icon={<TruckIcon className="w-8 h-8" />}
            title={language === 'ar' ? 'بوابة السائقين' : 'Driver Portal'}
            description={language === 'ar' ? 'إدارة الطلبات والتوصيل' : 'Order & Delivery Management'}
            onClick={() => onNavigate('login')} // Default login for drivers for now
            color="bg-emerald-600"
          />

          <QuickPortalCard 
            icon={<LockIcon className="w-8 h-8" />}
            title={language === 'ar' ? 'لوحة تحكم الإدارة' : 'Admin Control Panel'}
            description={language === 'ar' ? 'للمشرفين والمطورين فقط' : 'For Admins & Developers Only'}
            onClick={() => onNavigate('admin_login')}
            color="bg-slate-900"
          />
        </motion.div>
      </div>
    </div>
  );
}

function QuickPortalCard({ icon, title, description, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all border border-gray-100 flex items-center gap-6 group text-right"
    >
      <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-black text-gray-900 text-lg">{title}</h4>
        <p className="text-gray-400 text-sm font-bold">{description}</p>
      </div>
      <ArrowRightIcon className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
    </button>
  );
}
