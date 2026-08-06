import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useI18n } from './lib/contexts/I18nContext';
import MoyasarForm from './MoyasarForm';
import { ShieldCheck, CreditCard, Smartphone, ShoppingBag, ArrowRight, CheckCircle, Package } from 'lucide-react';
import { SaudiFlag } from './SaudiFlag';

export default function Checkout() {
  const { items: cart, total: totalPrice, clearCart } = useCart();
  const { user, loginWithOtp, verifyOtpAndLogin } = useAuth();
  const { language, formatCurrency } = useI18n();
  
  const [step, setStep] = useState<'details' | 'otp' | 'payment' | 'success'>('details');
  const [phone, setPhone] = useState(user?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MIN_ORDER_VAL = 50;
  const isCartValid = totalPrice >= MIN_ORDER_VAL;

  const handleStartOtp = async () => {
    if (!phone || phone.length < 9) {
      setError(language === 'ar' ? 'يرجى إدخال رقم جوال صحيح' : 'Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.sendOTP(phone);
      setStep('otp');
    } catch (error: any) {
      setError(language === 'ar' ? 'فشل إرسال الرمز: ' + error.message : 'Failed to send code: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.verifyOTPAndSignIn(phone, otpCode);
      setStep('payment');
    } catch (error: any) {
      setError(language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If user is already authenticated via phone, skip OTP
    if (user?.role === 'customer' && step === 'details') {
      setStep('payment');
    }
  }, [user, step]);

  if (step === 'success') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in" dir="rtl">
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8"
        >
          <CheckCircle className="w-12 h-12" />
        </motion.div>
        <h2 className="text-4xl font-black text-slate-900 mb-4">تم استلام طلبك بنجاح!</h2>
        <p className="text-slate-500 font-bold mb-8 max-w-md">شكرًا لثقتك بـ دلتا ستارز. سيقوم المساعد عدي بمتابعة طلبك وتحديثك بحالته قريباً.</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-emerald-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition-all"
        >
          العودة للمتجر
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16 md:pt-24 pb-12 font-['Tajawal']" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Progress Bar */}
        <div className="flex justify-between mb-8 md:mb-16 relative px-4 md:px-8">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 right-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500" 
               style={{ width: step === 'details' ? '0%' : step === 'otp' ? '50%' : '100%' }}></div>
          
          {['details', 'otp', 'payment'].map((s, idx) => (
            <div key={s} className="relative z-10 flex flex-col items-center">
              <div className={`w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center font-black shadow-xl transition-all text-sm md:text-base
                ${step === s ? 'bg-emerald-600 text-white scale-110' : 'bg-white text-gray-300'}`}>
                {idx + 1}
              </div>
              <span className={`text-[9px] md:text-[10px] mt-2 font-black uppercase tracking-widest ${step === s ? 'text-emerald-700' : 'text-gray-400'}`}>
                {s === 'details' ? 'التحقق' : s === 'otp' ? 'الكود' : 'الدفع'}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
          
          {/* Main Checkout Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-4xl p-5 md:p-10 border border-gray-100 min-h-0 md:min-h-[500px]">
              <AnimatePresence mode="wait">
                
                {step === 'details' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 md:space-y-10"
                  >
                    <div className="flex items-center gap-4 md:gap-6 border-b pb-4 md:pb-8">
                      <div className="p-3 md:p-4 bg-emerald-50 rounded-xl md:rounded-[1.5rem] text-emerald-600 shrink-0">
                        <Smartphone className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800">بيانات التواصل والتحقق</h2>
                        <p className="text-xs md:text-sm text-slate-400 font-bold mt-1">نستخدم نظام OTP آمن لضمان ملكية صاحب الرقم للطلب</p>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <label className="block text-xs md:text-sm font-black text-slate-500 mr-2">رقم الجوال السعودي</label>
                      <div className="relative group">
                        <input 
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05xxxxxxxx"
                          className="w-full p-4 md:p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-3xl focus:border-emerald-500 outline-none font-black text-lg md:text-2xl transition-all pr-20 md:pr-24"
                        />
                        <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 md:gap-3 text-slate-400 border-l pl-3 md:pl-4">
                          <SaudiFlag className="w-7 md:w-9 h-5 md:h-6 rounded shadow-sm border border-emerald-600/30" />
                          <span className="font-black text-sm md:text-lg">+966</span>
                        </div>
                      </div>
                      {error && <p className="text-red-500 text-xs font-black mr-2 animate-bounce">⚠️ {error}</p>}
                    </div>

                    <button 
                      onClick={handleStartOtp}
                      disabled={loading || !isCartValid}
                      className="w-full py-4 md:py-6 bg-slate-900 text-white rounded-2xl md:rounded-[2rem] font-black text-base md:text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 md:gap-4 disabled:opacity-50 disabled:grayscale animate-pulse-slow"
                    >
                      {loading ? (
                        <div className="w-5 h-5 md:w-6 md:h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          إرسال كود التحقق الآمن
                          <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
                        </>
                      )}
                    </button>

                    {!isCartValid && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center font-black text-sm border-2 border-red-100">
                         ⚠️ الحد الأدنى لإتمام الطلب هو {MIN_ORDER_VAL} ريال. فضلاً أضف المزيد من المنتجات.
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 'otp' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-6 md:space-y-10 py-4 md:py-8"
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-50 text-emerald-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner">
                      <ShieldCheck className="w-8 h-8 md:w-12 md:h-12" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-3xl font-black text-slate-800">أدخل رمز التحقق</h2>
                      <p className="text-xs md:text-base text-slate-400 font-bold mt-2">أرسلنا الرمز المكون من 4 أرقام إلى الرقم {phone}</p>
                    </div>
                    
                    <div className="relative max-w-xs mx-auto">
                      <input 
                        type="text"
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="w-full text-center text-3xl md:text-5xl p-4 md:p-6 bg-slate-50 border-2 md:border-4 border-slate-100 rounded-2xl md:rounded-[2.5rem] tracking-[0.5em] font-black focus:border-emerald-500 outline-none transition-all shadow-inner"
                        placeholder="----"
                      />
                    </div>

                    {error && <p className="text-red-500 text-sm font-black animate-pulse">{error}</p>}

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 md:pt-10 px-4 md:px-8">
                       <button onClick={() => setStep('details')} className="flex-1 py-4 border-2 border-slate-200 rounded-xl md:rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-sm md:text-base">تغيير الرقم</button>
                       <button 
                        onClick={handleVerifyOtp} 
                        disabled={loading || otpCode.length < 4}
                        className="flex-[2] py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-base md:text-xl shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                       >
                         تحقق ومتابعة للدفع 💳
                       </button>
                    </div>
                  </motion.div>
                )}

                {step === 'payment' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-10">
                    <div className="flex items-center gap-4 md:gap-6 border-b pb-4 md:pb-8">
                      <div className="p-3 md:p-4 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-[1.5rem] shrink-0">
                        <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800">بوابة الدفع السيادية (Moyasar)</h2>
                        <p className="text-[10px] md:text-xs text-emerald-600 font-black uppercase tracking-[0.2em] mt-1">Enterprise Security Architecture Active</p>
                      </div>
                    </div>

                    <div className="rounded-2xl md:rounded-[3rem] overflow-hidden border-2 md:border-4 border-slate-50 shadow-inner p-3 md:p-4 bg-slate-50/50">
                      <MoyasarForm amount={totalPrice} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-emerald-50 rounded-xl md:rounded-2xl text-emerald-700 text-[9px] md:text-[10px] font-black border border-emerald-100">
                        <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                        <span>مشفر تماماً بمعايير PCI-DSS لضمان أمان بطاقتك.</span>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 bg-slate-900 rounded-xl md:rounded-2xl text-white text-[9px] md:text-[10px] font-black">
                        <Package className="w-4 h-4 md:w-5 md:h-5 text-emerald-500 shrink-0" />
                        <span>سيتم التوجيه الجغرافي لأقرب سائق فور إتمام الدفع.</span>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="space-y-6 md:space-y-8">
            <div className="bg-white rounded-2xl md:rounded-[3rem] shadow-3xl p-4 md:p-8 border border-gray-100 sticky top-24 md:top-28">
              <h3 className="text-lg md:text-xl font-black mb-4 md:mb-8 flex items-center justify-between">
                ملخص السلّة
                <span className="text-xs bg-emerald-100 px-3 py-1 rounded-full text-emerald-700 font-black">{cart.length} أصناف</span>
              </h3>
              
              <div className="space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1 md:pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50/50 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-slate-100/50">
                    <div className="flex gap-4 items-center">
                      <img src={item.image} className="w-16 h-16 rounded-2xl object-cover shadow-md" alt={item.title || "صورة المنتج السريعة"} />
                      <div>
                        <p className="text-sm font-black leading-tight text-slate-800">{item.title}</p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                          {item.quantity} x {item.price} ر.س
                        </p>
                      </div>
                    </div>
                    <div className="text-left font-black text-emerald-700 text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 space-y-5 border-t-2 border-dashed pt-8">
                <div className="flex justify-between text-sm font-bold text-slate-400">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>ضريبة القيمة المضافة</span>
                  <span className="bg-emerald-100 px-2 py-0.5 rounded-lg text-[9px] font-black">شاملة الـ 15%</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-black text-slate-900 pt-4">
                  <span>الإجمالي</span>
                  <span className="text-emerald-600">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-slate-900 rounded-[2rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                <h4 className="text-xs font-black mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  ضمان دلتا ستارز
                </h4>
                <p className="text-[9px] leading-relaxed opacity-60 font-bold">
                  نحن نضمن نضارة المنتجات بنسبة 100%. في حال لم تكن راضياً عن الجودة، نلتزم بالتبديل الفوري أو استرداد المبلغ.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
