
import React, { useState, useEffect } from 'react';
import { useI18n } from './contexts/I18nContext';
import { COMPANY_INFO } from '../constants';
import { XIcon, SparklesIcon, FingerprintIcon, StarIcon, DocumentTextIcon } from './contexts/Icons';
import { MadaLogo, VisaLogo, MastercardLogo, ApplePayLogo, GooglePayLogo, TabbyLogo, TamaraLogo, PayPalLogo, MoyasarLogo, MoyasarAnbSecureBadge } from '../PaymentIcons';

interface PaymentPortalProps {
    amount: number;
    orderId: string;
    initialMethod?: 'mada' | 'visa' | 'apple' | 'bank' | 'paypal';
    onSuccess: (transactionId: string) => void;
    onCancel: () => void;
}

export const PaymentPortal: React.FC<PaymentPortalProps> = ({ amount, orderId, initialMethod, onSuccess, onCancel }) => {
    const { language, formatCurrency } = useI18n();
    const [step, setStep] = useState<'method' | 'card' | 'paypal' | 'bank' | 'tabby' | 'tamara' | 'processing' | 'success'>('method');
    const [method, setMethod] = useState<'mada' | 'visa' | 'apple' | 'bank' | 'paypal' | 'tabby' | 'tamara'>(initialMethod || 'mada');

    // Credit card interactive states
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [holder, setHolder] = useState('');

    // Format card number as 0000 0000 0000 0000
    const handleCardNumberChange = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length > 0) {
            setCardNumber(parts.join(' '));
        } else {
            setCardNumber(v);
        }
    };

    // Format expiry as MM/YY
    const handleExpiryChange = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length >= 2) {
            setExpiry(`${v.slice(0, 2)}/${v.slice(2, 4)}`);
        } else {
            setExpiry(v);
        }
    };

    // Detect card brand dynamically
    const getCardBrand = () => {
        const clean = cardNumber.replace(/\s+/g, '');
        if (clean.startsWith('4')) return 'visa';
        if (/^(51|52|53|54|55)/.test(clean)) return 'mastercard';
        // Saudi mada card ranges commonly start with 58, 60, 966, 4 or 5
        if (/^(58|60|966|48|49|50)/.test(clean)) return 'mada';
        return 'unknown';
    };

    useEffect(() => {
        if (initialMethod) {
            if (initialMethod === 'paypal') setStep('paypal');
            else if (initialMethod === 'bank') setStep('bank');
            // @ts-ignore
            else if (initialMethod === 'tabby') setStep('tabby');
            // @ts-ignore
            else if (initialMethod === 'tamara') setStep('tamara');
            else setStep('card');
        }
    }, [initialMethod]);

    const handlePayment = () => {
        setStep('processing');
        setTimeout(() => {
            setStep('success');
            setTimeout(() => onSuccess(`TXN-${Date.now()}`), 2000);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-10 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-4xl overflow-hidden border-t-[15px] border-primary relative flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-8 md:p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="flex items-center gap-4">
                        <MoyasarLogo className="h-10 shrink-0" />
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tighter leading-none mb-1">{language === 'ar' ? 'بوابة سداد دلتا ستارز' : 'Delta Stars Payment Gateway'}</h2>
                            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Secured by Moyasar IPG & anb
                            </p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="bg-gray-100/50 hover:bg-black hover:text-white p-4 rounded-full transition-all group">
                        <XIcon className="w-6 h-6 group-hover:rotate-90 transition-transform"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {step === 'method' && (
                        <div className="space-y-8 animate-fade-in-right">
                            <div className="bg-primary/5 p-8 rounded-[2.5rem] border-2 border-primary/10 flex justify-between items-center shadow-inner">
                                <div>
                                    <p className="text-gray-500 font-bold mb-1 text-sm">{language === 'ar' ? 'إجمالي المستحقات' : 'Total Payable'}</p>
                                    <p className="text-5xl font-black text-primary tracking-tighter leading-none">{formatCurrency(amount)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">DeltaID-91</p>
                                    <div className="bg-primary text-white text-[10px] px-3 py-1 rounded-full font-black">#{orderId.split('-')[0]}</div>
                                </div>
                            </div>

                            {/* Moyasar & Arab National Bank Integration Trust Badge */}
                            <MoyasarAnbSecureBadge lang={language === 'ar' ? 'ar' : 'en'} className="shadow-sm" />

                            <h3 className="text-xl font-black text-slate-800 border-r-4 border-secondary pr-4 leading-none">{language === 'ar' ? 'تحديد وسيلة السداد' : 'Select Payment Method'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button onClick={() => { setMethod('visa'); setStep('card'); }} className="p-6 bg-white border-2 border-gray-100 rounded-3xl flex flex-col justify-between items-center hover:border-primary transition-all group hover:bg-slate-50 shadow-sm">
                                    <div className="flex gap-2.5 mb-4 items-center">
                                        <MadaLogo className="h-5" />
                                        <VisaLogo className="h-4.5" />
                                        <MastercardLogo className="h-5" />
                                    </div>
                                    <span className="text-sm font-black group-hover:text-primary">مدى / فيزا / ماستركارد</span>
                                </button>

                                <button onClick={() => { setMethod('apple'); setStep('processing'); setTimeout(() => { setStep('success'); setTimeout(() => onSuccess(`TXN-APL-${Date.now()}`), 1500); }, 2000); }} className="p-6 bg-white border-2 border-gray-100 rounded-3xl flex flex-col justify-between items-center hover:border-black transition-all group hover:bg-slate-50 shadow-sm">
                                    <div className="flex gap-2.5 mb-4 items-center">
                                        <ApplePayLogo className="h-5" />
                                        <GooglePayLogo className="h-5" />
                                    </div>
                                    <span className="text-sm font-black group-hover:text-black">Apple Pay / Google Pay</span>
                                </button>

                                <button onClick={() => { setMethod('tabby'); setStep('tabby'); }} className="p-6 bg-white border-2 border-gray-100 rounded-3xl flex flex-col justify-between items-center hover:border-green-500 transition-all group hover:bg-green-50/20 shadow-sm">
                                    <div className="mb-4">
                                        <TabbyLogo className="h-6" />
                                    </div>
                                    <span className="text-sm font-black text-slate-800 group-hover:text-green-700">تقسيط تابي (4 دفعات)</span>
                                </button>

                                <button onClick={() => { setMethod('tamara'); setStep('tamara'); }} className="p-6 bg-white border-2 border-gray-100 rounded-3xl flex flex-col justify-between items-center hover:border-amber-500 transition-all group hover:bg-amber-50/20 shadow-sm">
                                    <div className="mb-4">
                                        <TamaraLogo className="h-6" />
                                    </div>
                                    <span className="text-sm font-black text-slate-800 group-hover:text-amber-700">تقسيط تمارا (بدون فوائد)</span>
                                </button>

                                <button onClick={() => { setMethod('paypal'); setStep('paypal'); }} className="p-6 bg-white border-2 border-gray-100 rounded-3xl flex flex-col justify-between items-center hover:border-blue-500 transition-all group hover:bg-blue-50 shadow-sm">
                                    <div className="mb-4">
                                        <PayPalLogo className="h-6" />
                                    </div>
                                    <span className="text-sm font-black text-blue-900">حساب باي بال (PayPal)</span>
                                </button>

                                <button onClick={() => setStep('bank')} className="p-6 bg-white border-2 border-gray-100 rounded-3xl flex flex-col justify-between items-center hover:border-primary transition-all group hover:bg-slate-50 shadow-sm">
                                    <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full text-primary font-black mb-4">🏦</div>
                                    <span className="text-sm font-black group-hover:text-primary">التحويل البنكي الرسمي (IBAN)</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'tabby' && (
                        <div className="space-y-10 py-10 text-center animate-fade-in-up">
                            <button onClick={() => setStep('method')} className="text-primary font-black flex items-center gap-2 hover:underline mb-10">&larr; طرق الدفع الأخرى</button>
                            <div className="bg-green-50/50 p-10 md:p-16 rounded-[4rem] border-4 border-[#ccff00]/30 shadow-2xl">
                                <div className="w-48 h-16 flex items-center justify-center rounded-xl mx-auto mb-10 bg-white shadow-xl p-3">
                                    <TabbyLogo className="h-8" />
                                </div>
                                <h3 className="text-3xl font-black text-green-950 mb-6 uppercase tracking-tighter">قسمها على 4 دفعات بدون فوائد</h3>
                                <p className="text-xl font-bold text-green-800 mb-10 leading-relaxed max-w-md mx-auto">سيتم توجيهك لمنصة تابي المعتمدة لإتمام عملية التقسيط بأمان تام.</p>
                                <button onClick={handlePayment} className="w-full py-8 bg-black text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                    متابعة عبر Tabby
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'tamara' && (
                        <div className="space-y-10 py-10 text-center animate-fade-in-up">
                            <button onClick={() => setStep('method')} className="text-primary font-black flex items-center gap-2 hover:underline mb-10">&larr; طرق الدفع الأخرى</button>
                            <div className="bg-amber-50/50 p-10 md:p-16 rounded-[4rem] border-4 border-[#ffcc99]/30 shadow-2xl">
                                <div className="w-48 h-16 flex items-center justify-center rounded-xl mx-auto mb-10 bg-white shadow-xl p-3">
                                    <TamaraLogo className="h-8" />
                                </div>
                                <h3 className="text-3xl font-black text-amber-950 mb-6 uppercase tracking-tighter">قسّط مشترياتك مع تمارا</h3>
                                <p className="text-xl font-bold text-amber-800 mb-10 leading-relaxed max-w-md mx-auto">استمتع بتجربة تسوق سيادية مع أطول فترة سداد ممكنة بدون رسوم إضافية.</p>
                                <button onClick={handlePayment} className="w-full py-8 bg-[#1A1A1A] text-white rounded-[2.5rem] font-black text-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                                    متابعة عبر Tamara
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'card' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <button onClick={() => setStep('method')} className="text-primary font-black flex items-center gap-2 hover:underline transition-all">&larr; الرجوع لطرق الدفع</button>
                            
                            {/* Interactive Virtual Card */}
                            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 p-8 md:p-10 rounded-[3rem] text-white shadow-3xl relative overflow-hidden border border-emerald-500/20">
                                <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full"></div>
                                <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/5 blur-3xl rounded-full"></div>
                                
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-11 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-inner opacity-90">
                                        <div className="grid grid-cols-3 gap-0.5 w-10 h-7 opacity-30">
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} className="border border-black/40 rounded-xs"></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-10 flex items-center">
                                        {getCardBrand() === 'visa' && (
                                            <VisaLogo className="h-4 filter brightness-200" />
                                        )}
                                        {getCardBrand() === 'mastercard' && (
                                            <MastercardLogo className="h-7" />
                                        )}
                                        {getCardBrand() === 'mada' && (
                                            <MadaLogo className="h-8 filter brightness-110" />
                                        )}
                                        {getCardBrand() === 'unknown' && (
                                            <FingerprintIcon className="w-10 h-10 text-emerald-400/50" />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="text-2xl md:text-3xl font-mono tracking-widest text-emerald-300 drop-shadow-md min-h-[40px] flex items-center">
                                        {cardNumber || '•••• •••• •••• ••••'}
                                    </div>
                                    
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[9px] text-slate-400 uppercase tracking-widest">Card Holder</p>
                                            <p className="font-mono text-sm tracking-wide uppercase truncate max-w-[180px]">
                                                {holder || 'Delta Stars Client'}
                                            </p>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="space-y-1 text-right">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-widest">Expires</p>
                                                <p className="font-mono text-sm">
                                                    {expiry || 'MM/YY'}
                                                </p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[9px] text-slate-400 uppercase tracking-widest">CVV</p>
                                                <p className="font-mono text-sm">
                                                    {cvv || '•••'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-black text-slate-500 mr-2">رقم البطاقة (مدى / فيزا / ماستركارد)</label>
                                    <input 
                                        type="text" 
                                        maxLength={19}
                                        value={cardNumber}
                                        onChange={(e) => handleCardNumberChange(e.target.value)}
                                        placeholder="0000 0000 0000 0000" 
                                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xl font-mono tracking-widest outline-none py-4 px-6 rounded-2xl transition-all" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 mr-2">تاريخ الانتهاء</label>
                                    <input 
                                        type="text" 
                                        maxLength={5}
                                        value={expiry}
                                        onChange={(e) => handleExpiryChange(e.target.value)}
                                        placeholder="MM/YY" 
                                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-lg font-mono text-center outline-none py-4 px-4 rounded-2xl transition-all" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 mr-2">الرمز السري (CVV)</label>
                                    <input 
                                        type="password" 
                                        maxLength={4}
                                        value={cvv}
                                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                                        placeholder="•••" 
                                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-lg font-mono text-center outline-none py-4 px-4 rounded-2xl transition-all" 
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-xs font-black text-slate-500 mr-2">اسم حامل البطاقة</label>
                                    <input 
                                        type="text" 
                                        value={holder}
                                        onChange={(e) => setHolder(e.target.value)}
                                        placeholder="CARDHOLDER NAME" 
                                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm font-mono tracking-widest outline-none py-4 px-6 rounded-2xl transition-all uppercase" 
                                    />
                                </div>
                            </div>

                            <button onClick={handlePayment} className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black text-xl shadow-3xl hover:scale-[1.01] active:scale-95 transition-all">
                                {language === 'ar' ? 'تأكيد السداد الآمن' : 'Confirm Secure Payment'}
                            </button>
                        </div>
                    )}

                    {step === 'paypal' && (
                        <div className="space-y-10 py-10 text-center animate-fade-in-up">
                            <button onClick={() => setStep('method')} className="text-primary font-black flex items-center gap-2 hover:underline mb-10 transition-all">&larr; الرجوع لطرق الدفع</button>
                            <div className="bg-blue-50 p-16 rounded-[4rem] border-4 border-blue-100 shadow-xl">
                                <div className="flex justify-center mb-10">
                                    <PayPalLogo className="h-10" />
                                </div>
                                <p className="text-xl font-bold text-blue-900 mb-10 leading-relaxed">سيتم توجيهك الآن إلى صفحة بايبال لإتمام عملية الدفع بأمان.</p>
                                <button onClick={handlePayment} className="w-full py-6 bg-[#0070ba] text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-[#005ea6] transition-all">
                                    الدفع بواسطة PayPal
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'bank' && (
                        <div className="space-y-8 animate-fade-in-up">
                            <button onClick={() => setStep('method')} className="text-primary font-black flex items-center gap-2 hover:underline transition-all">&larr; الرجوع لطرق الدفع</button>
                            
                            {/* Premium Saudi Bank Transfer Display */}
                            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-8 md:p-10 rounded-[3rem] shadow-4xl relative overflow-hidden border border-emerald-500/30">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full"></div>
                                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                                    <h3 className="text-2xl font-black flex items-center gap-3">
                                        <span>🏦</span>
                                        <span>بيانات التحويل البنكي الرسمي</span>
                                    </h3>
                                    <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-3 py-1.5 rounded-full border border-amber-400/30">
                                        الحساب المعتمد
                                    </span>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                                        <div>
                                            <p className="text-emerald-300 font-black text-[10px] uppercase tracking-widest mb-1">اسم البنك</p>
                                            <p className="text-2xl font-black">{COMPANY_INFO.bank.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-emerald-300 font-black text-[10px] uppercase tracking-widest mb-1 text-right">اسم الحساب المستفيد</p>
                                            <p className="text-lg font-black">{COMPANY_INFO.bank.account_name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                            <p className="text-emerald-300 font-black text-[10px] uppercase tracking-widest mb-1">رقم الحساب</p>
                                            <p className="text-lg font-mono font-bold tracking-wider">{COMPANY_INFO.bank.account_number}</p>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                                            <p className="text-emerald-300 font-black text-[10px] uppercase tracking-widest mb-1">رقم الفرع</p>
                                            <p className="text-lg font-mono font-bold tracking-wider">{COMPANY_INFO.bank.branch}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white/10 hover:bg-white/15 p-6 rounded-2xl border border-white/20 group cursor-pointer transition-all active:scale-[0.99]" onClick={() => {
                                        navigator.clipboard.writeText(COMPANY_INFO.bank.iban);
                                        alert('تم نسخ رقم الآيبان بنجاح');
                                    }}>
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-emerald-300 font-black text-[10px] uppercase tracking-widest">رقم الآيبان (IBAN)</p>
                                            <span className="text-[9px] text-emerald-300/80 underline font-black">نسخ الرقم</span>
                                        </div>
                                        <p className="text-xl font-mono font-bold break-all group-hover:text-amber-300 transition-colors">{COMPANY_INFO.bank.iban}</p>
                                        <p className="mt-2 text-[8px] opacity-40 uppercase font-black">اضغط لنسخ رقم الآيبان فوراً</p>
                                    </div>
                                </div>
                            </div>

                            {/* Trust & instructions */}
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center space-y-4">
                                <DocumentTextIcon className="w-12 h-12 text-emerald-600/20 mx-auto" />
                                <p className="text-slate-600 font-bold max-w-md mx-auto leading-relaxed">
                                    يرجى إجراء التحويل البنكي للمبلغ المطلوب ثم النقر على تأكيد التحويل لإرسال صورة إيصال التحويل مباشرة للمساعد عدي عبر واتساب لتأكيد طلبك فوراً.
                                </p>
                                <button 
                                    onClick={() => window.open(`https://wa.me/${COMPANY_INFO.whatsapp}?text=السلام%20عليكم%20ورحمة%20الله،%20قمت%20بالتحويل%20البنكي%20لطلب%20دلتا%20ستارز%20رقم:%20${orderId}`, '_blank')} 
                                    className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-all"
                                >
                                    <span>💬</span>
                                    <span>تأكيد التحويل عبر واتساب</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="py-20 text-center space-y-10 animate-pulse">
                            <div className="w-32 h-32 border-8 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-2xl"></div>
                            <h3 className="text-3xl font-black text-primary">{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</h3>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-16 text-center space-y-8 animate-fade-in-up">
                            <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-4xl text-white text-6xl">✓</div>
                            <h3 className="text-4xl font-black text-slate-800">{language === 'ar' ? 'تمت العملية بنجاح' : 'Success!'}</h3>
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-center items-center gap-10 grayscale opacity-70">
                    <MadaLogo className="h-6" />
                    <MoyasarLogo className="h-7" />
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-tighter">
                        <span className="p-1 bg-green-500 text-white rounded">SSL</span> 256-bit Secure
                    </div>
                </div>
            </div>
        </div>
    );
};
