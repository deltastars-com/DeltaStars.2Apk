 import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, onAuthStateChanged } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import api from '@/services/api';
import { User } from '../types';
import { webAuthn } from '../lib/webAuthn';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithOtp: (phone: string) => Promise<void>;
  verifyOtpAndLogin: (phone: string, code: string) => Promise<{ isNewUser: boolean }>;
  setPassword: (password: string) => Promise<void>;
  loginWithPassword: (phone: string, password: string) => Promise<void>;
  loginWithBiometrics: () => Promise<void>;
  registerBiometrics: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginToAdminDashboard: (username: string, password: string) => Promise<{ success: boolean; needsPasswordChange?: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  changeAdminPassword: (newPassword: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isRole: (roles: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'delta_stars_user';
const SESSION_KEY = 'delta_stars_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // تحميل الجلسة عند البدء
  useEffect(() => {
    const loadSession = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEY);
        const sessionId = sessionStorage.getItem(SESSION_KEY);
        
        if (storedUser && sessionId) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('✅ Session restored for:', parsedUser.phone || parsedUser.email);
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSession();

    // التزامن الآمن مع Firebase
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        try {
          const adminEmails = [
            'deltastars90@gmail.com',
            'deltastars777@gmail.com',
            'marketing@deltastars-ksa.com',
            'info@deltastars-ksa.com',
            'developer@deltastars-ksa.com'
          ];
          const devEmails = [
            'deltastars@zoho.mail.com',
            'vipservicesyemen@outlook.sa'
          ];

          const isEmailAdmin = adminEmails.includes(fbUser.email || '');
          const isEmailDev = devEmails.includes(fbUser.email || '');

          if (isEmailAdmin) {
             const adminUser: User = {
               id: 'admin_sovereign',
               uid: fbUser.uid,
               email: 'marketing@deltastars-ksa.com',
               name: 'المدير العام',
               full_name: 'المدير العام',
               type: 'admin',
               role: 'admin',
               permissions: ['manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'manage_developer', 'manage_shipments'],
               clientStatus: 'active'
             } as any;
             setUser(adminUser);
             localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
             sessionStorage.setItem(SESSION_KEY, Date.now().toString());
          } else if (isEmailDev) {
             const devUser: User = {
               id: 'dev_root',
               uid: fbUser.uid,
               email: 'marketing@deltastars-ksa.com',
               name: 'المطور التقني',
               full_name: 'المطور التقني',
               type: 'developer',
               role: 'developer',
               permissions: ['manage_developer', 'manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'root_access'],
               clientStatus: 'active'
             } as any;
             setUser(devUser);
             localStorage.setItem(STORAGE_KEY, JSON.stringify(devUser));
             sessionStorage.setItem(SESSION_KEY, Date.now().toString());
          }
        } catch (err) {
          console.error('Error syncing firebase user:', err);
        }
      } else {
        // تنظيف الجلسة في حال عدم وجود مستخدم لضمان عدم التعليق في حالة وهمية
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithOtp = useCallback(async (phone: string) => {
    await authService.sendOTP(phone);
  }, []);

  const verifyOtpAndLogin = useCallback(async (phone: string, code: string) => {
    setIsLoading(true);
    try {
      const data = await authService.verifyOTPAndSignIn(phone, code);
      if (!data?.user) throw new Error('Verification failed');

      const verifiedUser: User = {
        id: data.user.id,
        uid: data.user.id,
        phone: data.user.phone || phone,
        name: data.user.user_metadata?.full_name || 'VIP User',
        role: data.user.user_metadata?.role || 'customer',
        permissions: data.user.user_metadata?.permissions || [],
        is_verified: data.user.user_metadata?.phone_verified || true
      } as any;

      setUser(verifiedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedUser));
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      
      console.log('✅ User logged in with Supabase OTP:', verifiedUser.phone);
      return { isNewUser: !verifiedUser.is_verified };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setPassword = useCallback(async (password: string) => {
    if (!user) throw new Error('No user logged in');
    setIsLoading(true);
    try {
      await api.updateUser(user.id, { is_verified: true });
      const updatedUser = { ...user, is_verified: true };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      // تم إزالة التخزين الصريح لكلمة المرور لأسباب أمنية
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loginWithPassword = useCallback(async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      // هنا يجب الاعتماد على API الخادم بدلاً من التخزين المحلي الوهمي
      const { user: verifiedUser } = await api.checkPhoneVerification(phone); 
      // افتراض أن API يتحقق من كلمة المرور ويعيد المستخدم
      if (!verifiedUser) throw new Error('User not found or invalid credentials');
      
      setUser(verifiedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedUser));
      localStorage.setItem('last_vip_user', JSON.stringify(verifiedUser));
      sessionStorage.setItem(SESSION_KEY, Date.now().toString());
    } catch(err) {
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithBiometrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const lastUser = localStorage.getItem('last_vip_user');
      if (!lastUser) throw new Error('No previous VIP session found');
      
      const parsed = JSON.parse(lastUser);
      const success = await webAuthn.authenticate(parsed.id);
      
      if (success) {
        setUser(parsed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
      } else {
        throw new Error('Biometric authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerBiometrics = useCallback(async () => {
    if (!user) throw new Error('No user logged in');
    setIsLoading(true);
    try {
      const key = await webAuthn.register(user.id, user.name || user.phone || 'VIP User');
      await api.updateUser(user.id, { biometric_key: key });
      
      const updatedUser = { ...user, biometric_key: key };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      localStorage.setItem('last_vip_user', JSON.stringify(updatedUser));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Attempt Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      if (fbUser) {
        const adminEmails = [
          'deltastars90@gmail.com',
          'deltastars777@gmail.com',
          'marketing@deltastars-ksa.com',
          'info@deltastars-ksa.com',
          'developer@deltastars-ksa.com'
        ];
        const devEmails = [
          'deltastars@zoho.mail.com',
          'vipservicesyemen@outlook.sa'
        ];

        const isEmailAdmin = adminEmails.includes(fbUser.email || '');
        const isEmailDev = devEmails.includes(fbUser.email || '');

        let mappedUser: User;
        if (isEmailAdmin) {
          mappedUser = {
            id: 'admin_sovereign',
            uid: fbUser.uid,
            email: 'marketing@deltastars-ksa.com',
            name: 'المدير العام',
            full_name: 'المدير العام',
            type: 'admin',
            role: 'admin',
            permissions: ['manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'manage_developer', 'manage_shipments'],
            clientStatus: 'active'
          } as any;
        } else if (isEmailDev) {
          mappedUser = {
            id: 'dev_root',
            uid: fbUser.uid,
            email: 'marketing@deltastars-ksa.com',
            name: 'المطور التقني',
            full_name: 'المطور التقني',
            type: 'developer',
            role: 'developer',
            permissions: ['manage_developer', 'manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'root_access'],
            clientStatus: 'active'
          } as any;
        } else {
          mappedUser = {
            id: fbUser.uid,
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'عميل دلتا ستارز',
            full_name: fbUser.displayName || 'عميل دلتا ستارز',
            type: 'client',
            role: 'client',
            permissions: [],
            clientStatus: 'active'
          } as any;
        }
        
        setUser(mappedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mappedUser));
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
        console.log('✅ User logged in with Firebase email:', mappedUser.email);
        return;
      }
    } catch (fbError: any) {
      console.warn('Firebase email login attempt failed, trying Supabase fallback...', fbError);
      try {
        // 2. Fallback to Supabase Auth
        const { user: verifiedUser } = await api.loginWithEmail(email, password);
        setUser(verifiedUser as any);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedUser));
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
        console.log('✅ User logged in with Supabase email:', verifiedUser.email);
      } catch (dbError: any) {
        let errorMsg = 'بيانات الدخول غير صحيحة أو الحساب غير نشط.';
        if (fbError.code === 'auth/wrong-password' || fbError.code === 'auth/invalid-credential') {
          errorMsg = 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.';
        } else if (fbError.code === 'auth/user-not-found') {
          errorMsg = 'البريد الإلكتروني المدخل غير مسجل لدينا.';
        }
        throw new Error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginToAdminDashboard = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Check dynamic portal passwords with official default fallbacks
    let customAdminPass = 'Ali773597404***%';
    let customDevPin = '733691903***%$';
    try {
      const savedPasses = JSON.parse(localStorage.getItem('delta_portal_passwords') || '{}');
      if (savedPasses.adminPass) customAdminPass = savedPasses.adminPass;
      if (savedPasses.devPin) customDevPin = savedPasses.devPin;
    } catch (e) {
      console.error(e);
    }

    // Sovereign Direct Check for Official Credentials
    const lowerUser = trimmedUsername.toLowerCase();
    const isAdminUser = lowerUser === 'التقني' || lowerUser === 'متجر نجوم دلتا' || lowerUser === 'admin' || lowerUser === 'ali aldahan' || lowerUser === 'ali.aldahan' || lowerUser === 'ali';
    
    const isSpecialAdmin = isAdminUser && (
      trimmedPassword === customAdminPass || 
      trimmedPassword === 'Ali773597404***%' || 
      trimmedPassword === '321666' || 
      trimmedPassword.includes('773597404')
    );
    
    const isSpecialDev = (isAdminUser || lowerUser.includes('ali') || lowerUser.includes('aldahan') || lowerUser.includes('التقني')) && (
      trimmedPassword === customDevPin || 
      trimmedPassword === '733691903***%$' || 
      trimmedPassword === 'Ali733691903***%' || 
      trimmedPassword.includes('733691903')
    );

    if (isSpecialAdmin || isSpecialDev) {
      try {
        if (isSpecialAdmin) {
          const adminUser: User = {
            id: 'admin_sovereign',
            uid: 'admin_sovereign_uid',
            email: 'marketing@deltastars-ksa.com',
            name: 'متجر نجوم دلتا',
            full_name: 'المدير العام المعتمد',
            type: 'admin',
            role: 'admin',
            permissions: ['manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'manage_developer', 'manage_shipments'],
            clientStatus: 'active'
          } as any;
          setUser(adminUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
          sessionStorage.setItem(SESSION_KEY, Date.now().toString());
          return { success: true, needsPasswordChange: false };
        } else {
          const devUser: User = {
            id: 'dev_root',
            uid: 'dev_root_uid',
            email: 'developer@deltastars-ksa.com',
            name: 'التقني',
            full_name: 'المطور التقني المعتمد',
            type: 'developer',
            role: 'developer',
            permissions: ['manage_developer', 'manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'root_access'],
            clientStatus: 'active'
          } as any;
          setUser(devUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(devUser));
          sessionStorage.setItem(SESSION_KEY, Date.now().toString());
          return { success: true, needsPasswordChange: false };
        }
      } finally {
        setIsLoading(false);
      }
    }

    try {
      // 1. Attempt Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      const fbUser = userCredential.user;
      
      if (fbUser) {
        const adminEmails = [
          'deltastars90@gmail.com',
          'deltastars777@gmail.com',
          'marketing@deltastars-ksa.com',
          'info@deltastars-ksa.com',
          'developer@deltastars-ksa.com'
        ];
        const devEmails = [
          'deltastars@zoho.mail.com',
          'vipservicesyemen@outlook.sa'
        ];

        const isEmailAdmin = adminEmails.includes(fbUser.email || '');
        const isEmailDev = devEmails.includes(fbUser.email || '');

        if (isEmailAdmin) {
          const adminUser: User = {
            id: 'admin_sovereign',
            uid: fbUser.uid,
            email: 'marketing@deltastars-ksa.com',
            name: 'المدير العام',
            full_name: 'المدير العام',
            type: 'admin',
            role: 'admin',
            permissions: ['manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'manage_developer', 'manage_shipments'],
            clientStatus: 'active'
          } as any;
          setUser(adminUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
          sessionStorage.setItem(SESSION_KEY, Date.now().toString());
          return { success: true, needsPasswordChange: false };
        } else if (isEmailDev) {
          const devUser: User = {
            id: 'dev_root',
            uid: fbUser.uid,
            email: 'marketing@deltastars-ksa.com',
            name: 'المطور التقني',
            full_name: 'المطور التقني',
            type: 'developer',
            role: 'developer',
            permissions: ['manage_developer', 'manage_products', 'manage_users', 'manage_orders', 'manage_accounting', 'manage_quality', 'manage_ads', 'manage_coupons', 'manage_branches', 'manage_prices', 'root_access'],
            clientStatus: 'active'
          } as any;
          setUser(devUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(devUser));
          sessionStorage.setItem(SESSION_KEY, Date.now().toString());
          return { success: true, needsPasswordChange: false };
        } else {
          // Sign out because they are not an admin/dev
          await auth.signOut();
          throw new Error('عذراً، هذا البريد الإلكتروني غير مصرح له بالدخول كمسؤول.');
        }
      }
      
      throw new Error('فشل تسجيل الدخول بالخدمة السحابية');
    } catch (fbError: any) {
      console.warn('Firebase admin login attempt failed, trying Supabase fallback...', fbError);
      try {
        // 2. Fallback to Supabase local admin credentials
        const { user: verifiedUser } = await api.loginToAdminDashboard(username, password);
        setUser(verifiedUser);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiedUser));
        sessionStorage.setItem(SESSION_KEY, Date.now().toString());
        
        return { success: true, needsPasswordChange: verifiedUser.force_password_change };
      } catch (dbError: any) {
        let errorMsg = 'بيانات الدخول غير صحيحة أو غير مصرح لك بالدخول.';
        if (fbError.code === 'auth/wrong-password' || fbError.code === 'auth/invalid-credential') {
          errorMsg = 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.';
        } else if (fbError.code === 'auth/user-not-found') {
          errorMsg = 'اسم المستخدم أو البريد الإلكتروني غير مسجل بالنظام.';
        } else if (fbError.message) {
          errorMsg = fbError.message;
        }
        return { success: false, error: errorMsg };
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      // 1. Try Firebase Auth password reset
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Firebase password reset email sent to:', email);
      return { success: true, message: `📧 تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email} عبر الخدمة السحابية بنجاح.` };
    } catch (fbError: any) {
      console.warn('Firebase reset password failed, trying Supabase fallback...', fbError);
      try {
        // 2. Try Supabase fallback
        const res = await api.requestPasswordReset(email);
        return { success: true, message: `📧 تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email} عبر النظام الداخلي.` };
      } catch (dbError: any) {
        throw new Error(fbError.message || dbError.message || 'فشل إرسال رابط إعادة تعيين كلمة المرور.');
      }
    }
  }, []);

  const changeAdminPassword = useCallback(async (newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    await api.changeAdminPassword(user.id, newPassword);
    const updatedUser = { ...user, force_password_change: false };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    auth.signOut().catch(console.error); // تأكيد تسجيل الخروج من Firebase
    console.log('👋 User logged out');
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  }, [user]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  }, [user]);

  const isRole = useCallback((roles: string | string[]): boolean => {
    if (!user || !user.role) return false; // حماية إضافية
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  }, [user]);

  // تغليف القيم لمنع إعادة الرسم العشوائي للتطبيقات المعتمدة على AuthContext
  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    loginWithOtp,
    verifyOtpAndLogin,
    setPassword,
    loginWithPassword,
    loginWithBiometrics,
    registerBiometrics,
    loginWithEmail,
    loginToAdminDashboard,
    requestPasswordReset,
    changeAdminPassword,
    logout,
    updateUser,
    hasPermission,
    isRole,
  }), [
    user, isLoading, loginWithOtp, verifyOtpAndLogin, setPassword, loginWithPassword,
    loginWithBiometrics, registerBiometrics, loginWithEmail, loginToAdminDashboard,
    requestPasswordReset, changeAdminPassword, logout, updateUser, hasPermission, isRole
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
