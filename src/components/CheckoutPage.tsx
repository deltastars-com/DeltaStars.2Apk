import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useI18n, useToast, ShieldCheckIcon, CreditCardIcon, SmartphoneIcon, WeightIcon, ArrowRightIcon, CheckCircleIcon } from './lib/contexts';
import MoyasarForm from './MoyasarForm';
import { MoyasarAnbSecureBadge } from './PaymentIcons';
import { SaudiFlag } from './SaudiFlag';

export default function CheckoutPage() {
  const { items: cart, total: totalPrice, clearCart } = useCart();
  const { user, loginWithOtp, verifyOtpAndLogin } = useAuth();
  const { t, language, formatCurrency } = useI18n();
  const { addToast } = useToast();

  const [step, setStep] = useState<'details' | 'otp' | 'payment' | 'success'>('details');
  const [phone, setPhone] = useState(user?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const MIN_ORDER_VAL = 50;
  const isCartValid = totalPrice >= MIN_ORDER_VAL;

  const handleStartOtp = async () => {
    if (!phone || phone.length < 9) {
      addToast(language === 'ar' ? 'يرجى إدخال رقم جوال صحيح' : 'Please enter a valid phone number', 'error');
      return;
    }
    setLoading(true);
    try {
      await authService.sendOTP(phone);
      setStep('otp');
      addToast(language === 'ar' ? 'تم إرسال رمز التحقق' : 'Verification code sent', 'success');
    } catch (error) {
      addToast(language === 'ar' ? 'فشل إرسال الرمز' : 'Failed to send code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await verifyOtpAndLogin(phone, otpCode);
      setStep('payment');
    } catch (error) {
      addToast(language === 'ar' ? 'رمز التحقق غير صحيح' : 'Invalid OTP code', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_verified && step === 'details') {
      setStep('payment');
    }
  }, [user, step]);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 font-display" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Progress Bar */}
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-secondary -translate-y-1/2 z-0 transition-all duration-500" 
               style={{ width: step === 'details' ? '0%' : step === 'otp' ? '33%' : step === 'payment' ? '66%' : '100%' }}></div>
          
          {['details', 'otp', 'payment', 'success'].map((s, idx) => (
            <div key={s} className="relative z-10 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg transition-colors
                ${step === s ? 'bg-secondary text-white' : 'bg-white text-gray-400'}`}>
                {idx + 1}
              </div>
              <span className="text-[10px] mt-2 font-black uppercase tracking-widest">{t(`checkout.steps.${s}`)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Checkout Area */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 min-h-[400px]">
              <AnimatePresence mode="wait">
                
                {step === 'details' && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center gap-4 border-b pb-6">
                      <div className="p-3 bg-primary/5 rounded-2xl text-primary">
                        <SmartphoneIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black">{language === 'ar' ? 'بيانات التواصل والتحقق' : 'Contact & Verification'}</h2>
                        <p className="text-xs text-gray-400 font-bold">{language === 'ar' ? 'نحتاج للتحقق من هويتك لتفعيل حساب VIP' : 'Verify identity to activate VIP status'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-black text-gray-500">{language === 'ar' ? 'رقم الجوال' : 'Mobile Number'}</label>
                      <div className="relative">
                        <input 
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="05xxxxxxxx"
                          className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-secondary outline-none font-black text-xl transition-all"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400 border-r pr-4">
                          <SaudiFlag className="w-7 h-5 rounded shadow-sm border border-emerald-600/30" />
                          <span className="font-bold">+966</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleStartOtp}
                      disabled={loading || !isCartValid}
                      className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl hover:bg-primary-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                    >
                      {loading ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          {language === 'ar' ? 'تأكيد وإرسال الرمز' : 'Confirm & Send Code'}
                          <ArrowRightIcon className="w-5 h-5 rotate-180" />
                        </>
                      )}
                    </button>

                    {!isCartValid && (
                      <p className="text-center text-red-500 text-xs font-bold animate-pulse">
                        {language === 'ar' ? `الحد الأدنى للطلب هو ${MIN_ORDER_VAL} ر.س` : `Minimum order is ${MIN_ORDER_VAL} SAR`}
                      </p>
                    )}
                  </motion.div>
                )}

                {step === 'otp' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8"
                  >
                    <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheckIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black">{language === 'ar' ? 'أدخل رمز التحقق' : 'Enter Verification Code'}</h2>
                    <p className="text-gray-400 font-bold">{language === 'ar' ? `أرسلنا الرمز إلى ${phone}` : `Code sent to ${phone}`}</p>
                    
                    <input 
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-48 text-center text-4xl p-4 bg-gray-50 border-4 border-gray-100 rounded-3xl tracking-[0.5em] font-black focus:border-secondary outline-none transition-all"
                    />

                    <div className="flex gap-4 pt-8">
                       <button onClick={() => setStep('details')} className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-bold hover:bg-gray-50">تغيير الرقم</button>
                       <button 
                        onClick={handleVerifyOtp} 
                        disabled={loading || otpCode.length < 6}
                        className="flex-[2] py-4 bg-secondary text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                       >
                         تحقق ومتابعة
                       </button>
                    </div>
                  </motion.div>
                )}

                {step === 'payment' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="flex items-center gap-4 border-b pb-6">
                      <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                        <CreditCardIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black">{language === 'ar' ? 'بوابة الدفع السيادية' : 'Sovereign Payment Gateway'}</h2>
                        <p className="text-xs text-secondary font-bold uppercase tracking-widest">Secured by Moyasar</p>
                      </div>
                    </div>

                    <div className="rounded-3xl overflow-hidden border-2 border-gray-100">
                      <MoyasarForm amount={totalPrice} />
                    </div>

                    <MoyasarAnbSecureBadge lang={language} />

                    <div className="flex items-center gap-2 p-4 bg-emerald-50/50 rounded-2xl text-emerald-700 text-[10px] font-black border border-emerald-500/10">
                      <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'ar' ? 'مشفر تماماً بمعايير PCI-DSS والمواصفات الأمنية لشبكة مدى والبنوك السعودية' : 'Fully encrypted with PCI-DSS standards and Saudi bank/mada security specifications'}</span>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] shadow-xl p-6 border border-gray-100">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                {language === 'ar' ? 'ملخص السلّة' : 'Cart Summary'}
                <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-500">{cart.length}</span>
              </h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-start border-b border-gray-50 pb-4">
                    <div className="flex gap-3">
                      <img src={item.image} className="w-12 h-12 rounded-xl object-cover" alt={item.title || "صورة المنتج"} />
                      <div>
                        <p className="text-xs font-black leading-tight">{item.title}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-1">
                          {item.quantity} x {item.price} ر.س
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-primary">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-4 border-t pt-6">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>المجموع الفرعي</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>ضريبة القيمة المضافة (15%)</span>
                  <span>{language === 'ar' ? 'شاملة' : 'Included'}</span>
                </div>
                <div className="flex justify-between items-center text-xl font-black text-primary border-t-2 border-dashed pt-4">
                  <span>{language === 'ar' ? 'الإجمالي السيادي' : 'Sovereign Total'}</span>
                  <span className="text-secondary">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            <div className="bg-primary p-6 rounded-[2rem] text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12"></div>
              <h4 className="text-sm font-black mb-2">{language === 'ar' ? 'ضمان دلتا ستارز' : 'Delta Stars Warranty'}</h4>
              <p className="text-[10px] leading-relaxed opacity-70">
                {language === 'ar' 
                  ? 'نضمن لك نضارة استثنائية ونقل مبرد بمعايير عالمية من المزرعة إليك.' 
                  : 'We guarantee exceptional freshness and global-standard refrigerated transport from the farm to you.'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
