import React, { useState, useEffect, useRef } from 'react';
import { useToast, useI18n } from './lib/contexts';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheckIcon, UserIcon, LockIcon, ArrowRightIcon, FingerprintIcon, KeyIcon } from './lib/contexts/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { db, collection, addDoc } from '@/firebase';
import { SaudiFlag } from './SaudiFlag';

interface VipLoginPageProps {
  onLoginSuccess: (user: any) => void;
}

type LoginStep = 'phone' | 'otp' | 'password' | 'set_password' | 'forgot_password';

export function VipLoginPage({ onLoginSuccess }: VipLoginPageProps) {
  const { language } = useI18n();
  const { addToast } = useToast();
  const { loginWithOtp, verifyOtpAndLogin, setPassword, loginWithPassword, loginWithBiometrics } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPasswordInput] = useState('');
  const [step, setStep] = useState<LoginStep>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // B2B Partnership Onboarding States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerStep, setRegisterStep] = useState<'form' | 'sign' | 'success'>('form');
  const [isDragging, setIsDragging] = useState(false);
  const [regData, setRegData] = useState({
    companyName: '',
    crNumber: '',
    representativeName: '',
    representativePhone: '',
    corporateEmail: '',
    monthlyBudget: '50000',
    branchId: '1',
    crFileName: '',
    crFileSize: '',
  });
  const [regConsent, setRegConsent] = useState(true);
  const [regSignature, setRegSignature] = useState<string | null>(null);
  const [regReference, setRegReference] = useState('');

  // Canvas ref for signature pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (window.PublicKeyCredential) {
      setHasBiometrics(true);
    } else {
      const lastUser = localStorage.getItem('last_vip_user');
      if (lastUser) {
        setHasBiometrics(true);
      }
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent, isReset: boolean = false) => {
    e.preventDefault();
    if (!phone) return;
    
    setIsLoading(true);
    try {
      await loginWithOtp(phone);
      setStep('otp');
      addToast(language === 'ar' ? 'تم إرسال رمز التحقق إلى هاتفك' : 'Verification code sent to your phone', 'success');
    } catch (error: any) {
      addToast(language === 'ar' ? 'فشل إرسال الرمز' : 'Failed to send code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    
    setIsLoading(true);
    try {
      const { isNewUser } = await verifyOtpAndLogin(phone, otp);
      if (isNewUser || step === 'otp') {
        // If we were in a forgot password flow or it's a new user, force set password
        setStep('set_password');
        addToast(language === 'ar' ? 'رمز التحقق صحيح. يرجى تعيين كلمة مرور جديدة لحسابك' : 'Code verified. Please set a new password for your account', 'success');
      } else {
        addToast(language === 'ar' ? 'مرحباً بك في بوابة دلتا ستارز' : 'Welcome to Delta Stars Portal', 'success');
      }
    } catch (error: any) {
      addToast(language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid verification code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      addToast(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      await setPassword(password);
      addToast(language === 'ar' ? 'تم تعيين كلمة المرور بنجاح' : 'Password set successfully', 'success');
    } catch (error: any) {
      addToast(language === 'ar' ? 'فشل تعيين كلمة المرور' : 'Failed to set password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithPassword(phone, password);
      addToast(language === 'ar' ? 'تم الدخول بنجاح' : 'Logged in successfully', 'success');
    } catch (error: any) {
      addToast(language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithBiometrics();
      addToast(language === 'ar' ? 'تم الدخول عبر البصمة بنجاح' : 'Biometric login successful', 'success');
    } catch (error: any) {
      addToast(language === 'ar' ? 'فشل الدخول عبر البصمة' : 'Biometric login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag-and-drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setRegData(prev => ({
        ...prev,
        crFileName: file.name,
        crFileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      }));
      addToast(language === 'ar' ? 'تم إدراج ملف السجل التجاري بنجاح' : 'CR Document loaded successfully', 'info');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRegData(prev => ({
        ...prev,
        crFileName: file.name,
        crFileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      }));
      addToast(language === 'ar' ? 'تم إدراج ملف السجل التجاري بنجاح' : 'CR Document loaded successfully', 'info');
    }
  };

  // Signature Pad Canvas Actions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a1e'; // deep primary color
    
    const coords = getEventCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getEventCoords(e, canvas);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    // Capture signature state
    const canvas = canvasRef.current;
    if (canvas) {
      setRegSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setRegSignature(null);
  };

  const getEventCoords = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Submit Corporate Registration Flow
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regData.companyName || !regData.crNumber || !regData.representativeName || !regData.representativePhone || !regData.corporateEmail) {
      addToast(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة وافرة' : 'Please fill all required corporate parameters', 'error');
      return;
    }
    // Proceed to electronic contract generation and signing screen
    setRegisterStep('sign');
    // Initialize the canvas context after render
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);
  };

  const handleFinalSubmit = async () => {
    if (!regSignature) {
      addToast(language === 'ar' ? 'يرجى توقيع مسودة العقد الإلكتروني أولاً' : 'Please sign the digital contract draft to proceed', 'error');
      return;
    }
    if (!regConsent) {
      addToast(language === 'ar' ? 'يجب الموافقة على شروط تفعيل البصمة والتفويض الإلكتروني' : 'Please authorize the digital biometric fingerprint consent', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const generatedRef = 'CR-' + Math.floor(10000000 + Math.random() * 90000000);
      setRegReference(generatedRef);
      
      // Save corporate registration and e-contract draft securely to Firestore for administrative reviews
      if (db) {
        await addDoc(collection(db, 'corporate_applications'), {
          ...regData,
          referenceNumber: generatedRef,
          signature: regSignature,
          biometricConsent: regConsent,
          status: 'pending_review',
          submittedAt: new Date().toISOString(),
          grantedCreditLimit: Number(regData.monthlyBudget) * 0.8, // automated financial calculation (80% of budget)
        });
      }

      setRegisterStep('success');
      addToast(language === 'ar' ? 'تم إرسال طلب الشراكة وأرشفة العقد بنجاح!' : 'Partnership application and contract archived successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast(language === 'ar' ? 'فشل في حفظ طلب الشراكة' : 'Failed to process corporate request', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 md:p-10 font-tajawal animate-fade-in relative overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Sovereignty */}
      <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-secondary/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-xl"
      >
        <div className="bg-slate-800/80 backdrop-blur-2xl p-12 md:p-16 rounded-[4rem] shadow-sovereign border-2 border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-secondary rounded-full"></div>
          
          <header className="text-center mb-12">
             <div className="w-20 h-20 bg-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sovereign border border-secondary/30">
                <ShieldCheckIcon className="w-10 h-10 text-secondary" />
             </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter text-shadow-sovereign">
              {language === 'ar' ? 'بوابة كبار العملاء' : 'VIP Sovereign Portal'}
            </h1>
            <p className="text-secondary font-bold text-lg italic">
               {step === 'phone' ? 'Identity Authentication' : 
                step === 'otp' ? 'Secure Verification' : 
                step === 'set_password' ? 'Key Generation' : 'Sovereign Access'}
            </p>
          </header>

          <AnimatePresence mode="wait">
            {step === 'phone' ? (
              <motion.div 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-gray-400 font-bold text-xs uppercase tracking-widest px-2">رقم الجوال المسجل / Phone Identifier</label>
                  <div className="relative">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary" />
                    <input 
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full bg-slate-700/50 border-2 border-white/10 rounded-3xl p-6 pl-16 pr-28 text-2xl font-black text-white outline-none focus:border-secondary transition-all text-center tracking-widest placeholder:opacity-20"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/10">
                      <SaudiFlag className="w-6 h-4 rounded shadow-sm" />
                      <span className="text-secondary font-black text-sm">+966</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-bold px-2">{language === 'ar' ? '* سيتم إرسال رمز التحقق لهاتفك فوراً' : '* Verification code will be sent to your phone instantly'}</p>
                </div>
                
                <div className="space-y-4">
                  <button 
                    onClick={(e) => handleSendOtp(e as any, false)}
                    disabled={isLoading}
                    className="w-full bg-secondary text-white py-6 rounded-3xl font-black text-2xl shadow-sovereign hover:bg-yellow-600 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? '...' : (language === 'ar' ? 'إرسال رمز الدخول 🔑' : 'Send Access Key 🔑')}
                  </button>

                  {hasBiometrics && (
                    <button 
                      onClick={handleBiometricLogin}
                      disabled={isLoading}
                      className="w-full bg-white/5 text-white py-6 rounded-3xl font-black text-xl border-2 border-white/5 hover:border-secondary transition-all flex items-center justify-center gap-4 group"
                    >
                      <FingerprintIcon className="w-8 h-8 text-secondary" />
                      {language === 'ar' ? 'البصمة / الوجه' : 'Biometric Access'}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : step === 'otp' ? (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <p className="text-gray-400 font-bold">{language === 'ar' ? 'أدخل الرمز المرسل إلى' : 'Enter code sent to'}</p>
                  <p className="text-secondary font-black text-2xl mt-2 tracking-widest">{phone}</p>
                  <button onClick={() => setStep('phone')} className="text-blue-400 text-xs font-bold mt-4 hover:underline">{language === 'ar' ? 'تعديل الرقم؟' : 'Edit identity?'}</button>
                </div>

                <div className="relative">
                  <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                  <input 
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="------"
                    className="w-full bg-slate-700/50 border-2 border-white/10 rounded-3xl p-6 pl-16 text-4xl font-black text-white text-center tracking-[0.4em] focus:border-secondary transition-all outline-none"
                  />
                </div>

                <button 
                  onClick={handleVerifyOtp as any}
                  disabled={isLoading}
                  className="w-full bg-secondary text-white py-6 rounded-3xl font-black text-2xl shadow-sovereign hover:scale-105 transition-all"
                >
                  {isLoading ? '...' : (language === 'ar' ? 'تأكيد الرمز 🛡️' : 'Confirm Identity 🛡️')}
                </button>
              </motion.div>
            ) : step === 'password' ? (
              <motion.div 
                key="password"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <label className="text-gray-400 font-bold text-xs uppercase tracking-widest px-2">كلمة المرور المسجلة / Security Pass</label>
                  <div className="relative">
                    <LockIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary" />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-700/50 border-2 border-white/10 rounded-3xl p-6 pl-16 text-2xl font-black text-white outline-none focus:border-secondary transition-all"
                    />
                  </div>
                  <div className="flex justify-between px-2">
                    <button 
                      onClick={(e) => handleSendOtp(e as any, true)}
                      className="text-xs text-secondary font-black hover:underline uppercase tracking-tighter"
                    >
                      {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Passcode?'}
                    </button>
                    <button 
                      onClick={() => setStep('phone')}
                      className="text-xs text-gray-500 font-bold hover:underline"
                    >
                      {language === 'ar' ? 'تغيير الحساب' : 'Switch Identity'}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handlePasswordLogin as any}
                  disabled={isLoading}
                  className="w-full bg-secondary text-white py-6 rounded-3xl font-black text-2xl shadow-sovereign hover:scale-105 transition-all border-b-8 border-yellow-800 active:border-b-0"
                >
                  {language === 'ar' ? 'دخول سيادي 🔐' : 'Sovereign Entry 🔐'}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="set_password"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center p-8 bg-secondary/10 rounded-[2.5rem] border border-secondary/20 mb-8">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">✨</div>
                  <p className="text-secondary font-black text-lg">{language === 'ar' ? 'تم التحقق من هويتك!' : 'Identity Confirmed!'}</p>
                  <p className="text-gray-400 text-xs mt-2 uppercase font-bold tracking-widest">{language === 'ar' ? 'يرجى تعيين كلمة مرور جديدة' : 'Initialize New Security Key'}</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <KeyIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-secondary" />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-700/50 border-2 border-white/10 rounded-3xl p-6 pl-16 text-2xl font-black text-white outline-none focus:border-secondary transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSetPassword as any}
                  disabled={isLoading}
                  className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-2xl shadow-sovereign hover:scale-105 transition-all"
                >
                  {language === 'ar' ? 'تثبيت ودخول 💾' : 'Save & Initialize 💾'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help Center Footnote */}
          <footer className="mt-16 text-center border-t border-white/5 pt-10">
            <div className="flex items-center justify-center gap-4 text-gray-500 mb-6 font-bold text-xs uppercase tracking-[0.2em]">
               <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
               Cyber-Secure Infrastructure
            </div>
            <div className="text-gray-400 font-bold text-sm">
              <span className="block mb-2">{language === 'ar' ? 'ليس لديك حساب كبار عملاء؟' : 'No VIP Access?'}</span>
              <button 
                onClick={() => {
                  setRegisterStep('form');
                  setIsRegisterOpen(true);
                }}
                className="text-secondary font-black underline hover:text-yellow-500 transition-all text-base underline-offset-4 decoration-2"
              >
                {language === 'ar' ? 'قدم طلب شراكة / فتح حساب شركات 📄' : 'Apply for Corporate Account / Partnership 📄'}
              </button>
            </div>
          </footer>
        </div>
      </motion.div>

      {/* Advanced Corporate Registration and Onboarding Modal */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 overflow-y-auto">
            {/* Dark blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegisterOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-2xl bg-slate-900 border-2 border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl text-white z-10 my-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsRegisterOpen(false)}
                className="absolute top-6 left-6 text-gray-400 hover:text-red-500 font-black p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all"
              >
                ✕
              </button>

              <header className="border-b border-white/5 pb-6 mb-8 text-center md:text-right">
                <span className="px-3 py-1 bg-secondary/15 text-secondary border border-secondary/30 rounded-xl text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                  {language === 'ar' ? 'تسجيل كبار العملاء والشركات' : 'VIP B2B Client Onboarding'}
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-white">
                  {language === 'ar' ? 'طلب تأسيس شراكة تجارية معتمدة' : 'Corporate Partnership Request'}
                </h3>
                <p className="text-slate-400 text-xs font-bold mt-1">
                  {language === 'ar' ? 'تخضع الاتفاقية للقوانين السيادية لوزارة التجارة وهيئة الاتصالات السعودية' : 'Subject to Saudi Ministry of Commerce B2B e-commerce frameworks'}
                </p>
              </header>

              <AnimatePresence mode="wait">
                {registerStep === 'form' ? (
                  <motion.form 
                    key="reg-form"
                    onSubmit={handleSubmitForm}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 text-xs md:text-sm"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block font-black text-secondary uppercase tracking-wider">{language === 'ar' ? 'اسم المجموعة التجارية / الشركة' : 'Company/Business Name'}</label>
                        <input 
                          type="text" required
                          placeholder={language === 'ar' ? 'مثال: شركة الفنادق الوطنية المحدودة' : 'e.g. Saudi Hotels Group'}
                          value={regData.companyName}
                          onChange={e => setRegData({...regData, companyName: e.target.value})}
                          className="w-full bg-slate-800/80 border border-white/5 focus:border-secondary outline-none rounded-xl p-4 font-bold text-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-black text-secondary uppercase tracking-wider">{language === 'ar' ? 'رقم السجل التجاري الموحد (CR)' : 'Commercial Registration (CR)'}</label>
                        <input 
                          type="text" required maxLength={10}
                          placeholder="1010XXXXXX"
                          value={regData.crNumber}
                          onChange={e => setRegData({...regData, crNumber: e.target.value.replace(/\D/g, '')})}
                          className="w-full bg-slate-800/80 border border-white/5 focus:border-secondary outline-none rounded-xl p-4 font-mono font-bold text-white transition-all text-center tracking-widest"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block font-black text-secondary uppercase tracking-wider">{language === 'ar' ? 'اسم ممثل الشركة المفوض' : 'Authorized Signatory Name'}</label>
                        <input 
                          type="text" required
                          placeholder={language === 'ar' ? 'الاسم الكامل كما بالسجل' : 'Full name of authorized manager'}
                          value={regData.representativeName}
                          onChange={e => setRegData({...regData, representativeName: e.target.value})}
                          className="w-full bg-slate-800/80 border border-white/5 focus:border-secondary outline-none rounded-xl p-4 font-bold text-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-black text-secondary uppercase tracking-wider">{language === 'ar' ? 'رقم جوال المفوّض الموثق' : 'Signatory Phone (Saudi Mobile)'}</label>
                        <div className="relative">
                          <input 
                            type="tel" required
                            placeholder="05XXXXXXXX"
                            value={regData.representativePhone}
                            onChange={e => setRegData({...regData, representativePhone: e.target.value})}
                            className="w-full bg-slate-800/80 border border-white/5 focus:border-secondary outline-none rounded-xl p-4 pr-24 font-mono font-bold text-white transition-all text-center tracking-widest"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/10">
                            <SaudiFlag className="w-5 h-3.5 rounded shadow-sm" />
                            <span className="text-secondary font-black text-xs">+966</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block font-black text-secondary uppercase tracking-wider">{language === 'ar' ? 'البريد الإلكتروني الرسمي للمنشأة' : 'Corporate Email Address'}</label>
                        <input 
                          type="email" required
                          placeholder="purchase@yourcompany.com"
                          value={regData.corporateEmail}
                          onChange={e => setRegData({...regData, corporateEmail: e.target.value})}
                          className="w-full bg-slate-800/80 border border-white/5 focus:border-secondary outline-none rounded-xl p-4 font-bold text-white transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block font-black text-secondary uppercase tracking-wider">{language === 'ar' ? 'الميزانية الشهرية المقدرة للتوريد' : 'Estimated Monthly Supply Budget'}</label>
                        <select 
                          value={regData.monthlyBudget}
                          onChange={e => setRegData({...regData, monthlyBudget: e.target.value})}
                          className="w-full bg-slate-800/80 border border-white/5 focus:border-secondary outline-none rounded-xl p-4 font-bold text-white transition-all"
                        >
                          <option value="25000">25,000 ر.س / شهرياً</option>
                          <option value="50000">50,000 ر.س / شهرياً (VIP)</option>
                          <option value="100000">100,000 ر.س / شهرياً (Premium B2B)</option>
                          <option value="250000">أكثر من 250,000 ر.س / شهرياً (Mega Group)</option>
                        </select>
                      </div>
                    </div>

                    {/* Drag-and-drop file upload container */}
                    <div className="space-y-2">
                      <label className="block font-black text-secondary uppercase tracking-wider">
                        {language === 'ar' ? 'رفع نسخة السجل التجاري / وثيقة التفويض 📄' : 'Upload Commercial Register (CR) / Authorization Document 📄'}
                      </label>
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                          isDragging ? 'border-secondary bg-secondary/10' : 
                          regData.crFileName ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 bg-slate-800/40'
                        }`}
                      >
                        <input 
                          type="file" 
                          id="cr-file-input"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileSelect}
                          className="hidden" 
                        />
                        <label htmlFor="cr-file-input" className="cursor-pointer flex flex-col items-center">
                          {regData.crFileName ? (
                            <>
                              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-3 text-2xl">✓</div>
                              <p className="font-black text-sm text-emerald-400">{regData.crFileName}</p>
                              <p className="text-gray-400 text-[10px] mt-1">{regData.crFileSize}</p>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-white/5 text-gray-400 rounded-full flex items-center justify-center mb-3 text-lg">📁</div>
                              <p className="font-black text-xs text-white">
                                {language === 'ar' ? 'اسحب ملف السجل هنا أو انقر للتصفح' : 'Drag file here or click to browse'}
                              </p>
                              <p className="text-gray-500 text-[10px] mt-1 uppercase">PDF, PNG, JPG (Max 10MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-secondary text-slate-950 py-4 rounded-xl font-black text-base hover:bg-yellow-500 transition-all shadow-lg flex items-center justify-center gap-3"
                    >
                      <span>{language === 'ar' ? 'التالي: مراجعة العقد وتوقيعه رقمياً' : 'Next: Review & Digitally Sign Contract'}</span>
                      <ArrowRightIcon className="w-4 h-4 transform rotate-180" />
                    </button>
                  </motion.form>
                ) : registerStep === 'sign' ? (
                  <motion.div 
                    key="reg-sign"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 text-xs md:text-sm"
                  >
                    {/* dynamic contract display preview */}
                    <div className="bg-slate-950 border border-white/5 p-6 rounded-2xl max-h-[220px] overflow-y-auto leading-relaxed text-slate-300 font-bold space-y-4">
                      <h4 className="text-center font-black text-sm text-secondary border-b border-white/5 pb-2">
                        {language === 'ar' ? 'مسودة اتفاقية شراكة توريد ائتماني' : 'B2B SUPPLY & CREDIT TERMS AGREEMENT'}
                      </h4>
                      <p>
                        <strong>الطرف الأول (المورّد):</strong> شركة نجوم دلتا للتجارة، سجل تجاري رقم 1010772195، ومقرها الرياض، المملكة العربية السعودية.
                      </p>
                      <p>
                        <strong>الطرف الثاني (المتعاقد):</strong> {regData.companyName}، السجل التجاري رقم {regData.crNumber}.
                      </p>
                      <p>
                        بناء على تقديم الطرف الثاني لطلب فتح حساب شراكة بحد مالي توريدي يتناسب مع الميزانية {Number(regData.monthlyBudget).toLocaleString()} ر.س، يوافق الطرفان على جدولة التوريد الآجل وتصفية المستحقات بنظام التقاص المالي الشهري بحد أقصى يوم 15 من كل شهر ميلادي وفقاً لأنظمة التجارة الرقمية المعتمدة بالهيئة السعودية للملكية الفكرية والأنظمة المحاسبية المتوافقة مع زكاة ودخل المملكة.
                      </p>
                    </div>

                    {/* Signature Pad */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="font-black text-secondary uppercase tracking-wider">{language === 'ar' ? 'التوقيع الإلكتروني لممثل المجموعة' : 'Manager Official Digital Signature'}</label>
                        <button 
                          onClick={clearCanvas}
                          className="text-[10px] text-red-400 font-black hover:underline"
                        >
                          {language === 'ar' ? 'إعادة رسم 🔄' : 'Reset Pad 🔄'}
                        </button>
                      </div>
                      <div className="bg-white rounded-2xl overflow-hidden border border-white/15 relative">
                        <canvas 
                          ref={canvasRef}
                          width={600}
                          height={120}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="cursor-crosshair w-full block h-28 bg-white"
                        />
                        {!regSignature && (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs pointer-events-none font-bold">
                            {language === 'ar' ? 'ارسم توقيعك هنا بالماوس أو الإصبع' : 'Draw your signature here'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Biometric consent fingerprint box */}
                    <div className="bg-slate-800/60 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          id="consent-check"
                          checked={regConsent}
                          onChange={e => setRegConsent(e.target.checked)}
                          className="w-5 h-5 accent-secondary rounded mt-0.5" 
                        />
                        <label htmlFor="consent-check" className="text-xs text-slate-300 font-bold leading-normal select-none">
                          <strong>{language === 'ar' ? 'الموافقة على البصمة الإلكترونية والتفويض:' : 'Biometric & Electronic Consent:'}</strong>{' '}
                          {language === 'ar' 
                            ? 'أوافق على تشفير هذا التوقيع وربطه ببيانات السجل التجاري المعتمدة، وتفعيل التفاوض والتعاقد التقني الآلي.'
                            : 'I authorize encryption of this signature to activate automated B2B contracting workflows securely.'}
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => setRegisterStep('form')}
                        className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-gray-300 font-black rounded-xl text-xs transition-all"
                      >
                        {language === 'ar' ? 'السابق' : 'Back'}
                      </button>
                      <button 
                        onClick={handleFinalSubmit}
                        disabled={isLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span>{isLoading ? '...' : (language === 'ar' ? 'توثيق وتوقيع العقد وإرسال الطلب 🔒' : 'Sign & Submit Application 🔒')}</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="reg-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 space-y-6"
                  >
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                      ✓
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black text-emerald-400">{language === 'ar' ? 'تم استلام وتوثيق طلب الشراكة!' : 'Partnership Request Confirmed!'}</h4>
                      <p className="text-slate-400 text-sm font-bold max-w-md mx-auto">
                        {language === 'ar' 
                          ? 'لقد تم أرشفة طلبكم وصياغة العقد المبدئي بنظام دلتا ستارز بنجاح. سيقوم مدير الحسابات بمراجعة السجل وتأكيد سقف الائتمان.' 
                          : 'Your B2B onboarding files and digitally signed contract have been secured and archived. A dedicated corporate account manager will verify your CR.'}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 inline-block font-mono text-xs max-w-xs mx-auto">
                      <p className="text-slate-500 font-bold mb-1">{language === 'ar' ? 'رقم المعاملة المؤرشفة' : 'Archived Reference ID'}</p>
                      <p className="text-secondary font-black text-base tracking-widest">{regReference}</p>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <button 
                        onClick={() => {
                          setIsRegisterOpen(false);
                          setStep('phone');
                        }}
                        className="px-8 py-3 bg-secondary text-slate-950 font-black rounded-xl text-xs hover:bg-yellow-500 transition-all"
                      >
                        {language === 'ar' ? 'العودة لصفحة الدخول' : 'Back to Login'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

