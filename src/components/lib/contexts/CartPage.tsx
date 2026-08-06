
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, Page, DeliveryMethod, Coupon } from '@/types';
import { COMPANY_INFO, BRANCH_LOCATIONS } from '../../constants';
import { TrashIcon, SparklesIcon, PhoneIcon, LocationMarkerIcon, UserIcon, GlobeAltIcon } from './Icons';
import { useI18n } from './I18nContext';
import { PaymentPortal } from '../PaymentPortal';
import { useToast } from '../../../contexts/ToastContext';
import { useFirebase } from './FirebaseContext';
import api from '@/services/api';
import { FleetRadar } from '../FleetRadar';
import { MadaLogo, VisaLogo, MastercardLogo, ApplePayLogo, TabbyLogo, TamaraLogo, PayPalLogo, MoyasarLogo } from '../../PaymentIcons';
import { SaudiFlag } from '../../SaudiFlag';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const AnyMapContainer = MapContainer as any;
const AnyTileLayer = TileLayer as any;
const AnyMarker = Marker as any;
const AnyPopup = Popup as any;

interface MapConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  lang: 'ar' | 'en';
}

function OrderConfirmationMapModal({ isOpen, onClose, orderId, lang }: MapConfirmationModalProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingCoords, setLoadingCoords] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    setLoadingCoords(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingCoords(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          // Fallback to approximate Riyadh coordinate
          setCoords({ lat: 24.7136, lng: 46.6753 });
          setLoadingCoords(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setCoords({ lat: 24.7136, lng: 46.6753 });
      setLoadingCoords(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const pulseIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-3 bg-emerald-500/40 rounded-full animate-ping duration-1000"></div>
        <div class="absolute -inset-1 bg-yellow-400/30 rounded-full animate-pulse"></div>
        <div class="relative bg-emerald-800 text-white border-2 border-yellow-400 rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
          📍
        </div>
      </div>
    `,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden border-2 border-yellow-500/40 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white p-6 md:p-8 border-b-4 border-yellow-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="relative z-10 flex items-center gap-4">
              <span className="text-3xl md:text-4xl">🛡️</span>
              <div className="text-right flex-1">
                <h3 className="text-xl md:text-2xl font-black font-tajawal text-yellow-400">
                  {isAr ? 'تم تأمين وتأكيد موقع التوصيل' : 'Delivery Location Secured & Confirmed'}
                </h3>
                <p className="text-xs md:text-sm text-gray-300 font-bold mt-1">
                  {isAr ? `رمز تتبع الشحنة: ${orderId.substring(0, 8)}` : `Tracking Token: ${orderId.substring(0, 8)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Map Content */}
          <div className="p-6 md:p-8 flex-grow overflow-y-auto space-y-6 flex flex-col">
            <p className="text-sm md:text-base text-gray-600 leading-relaxed font-bold text-center">
              {isAr 
                ? 'تقديراً لثقتكم الغالية، تم تفعيل خريطة التوصيل الذكية لتحديد موقعكم التقريبي وإرسال الشحنة من الفرع الأقرب لضمان طزاجة الخضار والفواكه وسرعة التسليم.'
                : 'To ensure your absolute confidence, we have generated a high-precision live coordinate link connecting your order directly to our nearest optimal warehouse branch.'
              }
            </p>

            {/* Map Container */}
            <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-inner border border-gray-200 bg-slate-100 min-h-[240px]">
              {loadingCoords ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50 z-10">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs md:text-sm font-black text-emerald-800 animate-pulse">
                    {isAr ? 'جاري الاتصال بالأقمار الصناعية لتحديد الموقع...' : 'Connecting to GPS Satellites...'}
                  </span>
                </div>
              ) : coords ? (
                <AnyMapContainer
                  center={[coords.lat, coords.lng]}
                  zoom={14}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                >
                  <AnyTileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <AnyMarker position={[coords.lat, coords.lng]} icon={pulseIcon}>
                    <AnyPopup>
                      <div className="text-center font-bold p-1">
                        <p className="text-xs text-emerald-800 font-black">{isAr ? '📍 موقع التوصيل التقريبي' : '📍 Approximate Delivery Spot'}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
                      </div>
                    </AnyPopup>
                  </AnyMarker>
                </AnyMapContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <span className="text-xs text-gray-400 font-bold">
                    {isAr ? 'تعذر تحميل الخريطة' : 'Could not load map'}
                  </span>
                </div>
              )}
            </div>

            {/* Explanatory Trust badges */}
            <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-500/10 text-center">
              <div>
                <span className="text-xl block mb-1">🏪</span>
                <span className="text-[10px] md:text-xs font-black text-emerald-900 block">
                  {isAr ? 'توصيل من أقرب فرع' : 'Dispatched from Nearest'}
                </span>
                <span className="text-[8.5px] text-gray-400 block mt-0.5">
                  {isAr ? 'توفير فوري للوقود والوقت' : 'Saves transit time'}
                </span>
              </div>
              <div className="border-r border-emerald-500/10">
                <span className="text-xl block mb-1">🥦</span>
                <span className="text-[10px] md:text-xs font-black text-emerald-900 block">
                  {isAr ? 'ضمان الجودة والطزاجة' : '100% Freshness Guarantee'}
                </span>
                <span className="text-[8.5px] text-gray-400 block mt-0.5">
                  {isAr ? 'وصول بارد وآمن تماماً' : 'Cold-chain tracked delivery'}
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
            <button
              onClick={onClose}
              className="w-full md:w-auto min-w-[200px] py-4 px-8 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-2xl font-black text-base md:text-lg shadow-[0_4px_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 text-center cursor-pointer border border-yellow-500/20"
            >
              {isAr ? 'تأكيد ومتابعة الطلب ✓' : 'Confirm & Proceed ✓'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface CartPageProps {
  cart: CartItem[];
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, newQuantity: number) => void;
  clearCart: () => void;
  setPage: (page: Page) => void;
  addPurchaseHistory: (items: CartItem[]) => void;
}

export function CartPage({ cart, removeFromCart, updateQuantity, clearCart, setPage, addPurchaseHistory }: CartPageProps) {
  const { t, language, formatCurrency } = useI18n();
  const { addToast } = useToast();

  const REMEMBERED_PHONE_KEY = 'delta-remembered-phone-v27';

  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'phone' | 'otp' | 'address' | 'delivery' | 'payment' | 'success'>('cart');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard');
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  const [orderId, setOrderId] = useState('');
  const [showMapModal, setShowMapModal] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'visa' | 'paypal' | 'mada' | 'cod' | 'bank_transfer' | 'tabby' | 'tamara' | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const { coupons, firebaseUser, user, createOrderWithInvoice, updateOrder } = useFirebase();
  const [phone, setPhone] = useState(() => {
    try {
      return localStorage.getItem(REMEMBERED_PHONE_KEY) || '';
    } catch (e) {
      return '';
    }
  });
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [waitTimer, setWaitTimer] = useState(0);

  const [address, setAddress] = useState({
    city: '', district: '', street: '', type: 'house', building: '', unit: ''
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const SHIPPING_FEE = 25;
  const FREE_SHIPPING_THRESHOLD = 200;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  const discountAmount = appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? (subtotal * appliedCoupon.value / 100) : appliedCoupon.value) : 0;
  const cashbackEarned = subtotal * 0.05; // 5% Cashback

  const totalWithVat = (subtotal - discountAmount + shippingFee) * 1.15;
  const MIN_ORDER_THRESHOLD = 50;

  const handleApplyCoupon = () => {
    const coupon = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase() && c.isActive);
    if (!coupon) {
      addToast(t('cart.invalidCoupon'), 'error');
      return;
    }
    if (subtotal < coupon.minOrderAmount) {
      addToast(t('cart.minOrderCoupon', { min: coupon.minOrderAmount }), 'warning');
      return;
    }
    setAppliedCoupon(coupon);
    addToast(t('cart.couponApplied'), 'success');
  };

  useEffect(() => {
    let timer: any;
    if (waitTimer > 0) {
      timer = setInterval(() => setWaitTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [waitTimer]);

  const handleStartCheckout = () => {
    if (subtotal < MIN_ORDER_THRESHOLD) {
      addToast(t('checkout.minOrderError'), 'error');
      return;
    }
    setCheckoutStep('phone');
  };

  const handleSendOtp = async () => {
    if (waitTimer > 0) return;
    const saudiPhoneRegex = /^(05|5)([0-9]{8})$/;
    if (!saudiPhoneRegex.test(phone)) {
      addToast(language === 'ar' ? "يرجى إدخال رقم هاتف صحيح (05XXXXXXXX)" : "Valid phone required", 'error');
      return;
    }

    setIsLoading(true);

    // Check if phone is already verified (First-time verification logic)
    try {
      const { isVerified } = await api.checkPhoneVerification(phone);
      if (isVerified) {
        localStorage.setItem(REMEMBERED_PHONE_KEY, phone);
        setCheckoutStep('address');
        addToast(t('cart.identityVerified'), 'success');
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error("Verification check failed", err);
    }

    try {
      await api.sendOtp(phone, 'checkout');
      setIsLoading(false);
      setCheckoutStep('otp');
      setWaitTimer(60);
      addToast(t('cart.otpSent'), 'success');
    } catch (err) {
      setIsLoading(false);
      addToast(t('cart.otpFailed'), 'error');
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    try {
      const { verified } = await api.verifyOtp(phone, otpInput, 'checkout');
      setIsLoading(false);

      if (verified) {
        localStorage.setItem(REMEMBERED_PHONE_KEY, phone);
        setCheckoutStep('address');
        addToast(t('cart.verifiedSuccess'), 'success');
      } else {
        addToast(t('cart.invalidCode'), 'error');
      }
    } catch (err) {
      setIsLoading(false);
      addToast(t('cart.verificationError'), 'error');
    }
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('delivery');
  };

  const handleDeliverySubmit = () => {
    setCheckoutStep('payment');
  };

  const handleFinalOrder = async (method: 'visa' | 'paypal' | 'mada' | 'cod' | 'bank_transfer' | 'tabby' | 'tamara') => {
    setIsLoading(true);

    // Simple branch assignment logic
    let assignedBranchId = BRANCH_LOCATIONS[0].id; // Default to Jeddah
    if (address.city.includes('الرياض') || address.city.toLowerCase().includes('riyadh')) assignedBranchId = 2;
    else if (address.city.includes('مكة') || address.city.toLowerCase().includes('makkah')) assignedBranchId = 3;
    else if (address.city.includes('المدينة') || address.city.toLowerCase().includes('madinah')) assignedBranchId = 4;
    else if (address.city.includes('الدمام') || address.city.toLowerCase().includes('dammam')) assignedBranchId = 5;
    else if (address.city.includes('أبها') || address.city.toLowerCase().includes('abha')) assignedBranchId = 6;

    try {
      setSelectedPaymentMethod(method);
      const orderId = await createOrderWithInvoice({
        customerPhone: phone,
        customerName: firebaseUser?.displayName || 'عميل VIP',
        items: cart,
        subtotal,
        shippingFee,
        discountAmount,
        total: totalWithVat,
        address: `${address.city}, ${address.district}, ${address.street}`,
        paymentMethod: method,
        cashbackEarned,
        couponCode: appliedCoupon?.code,
        customerId: firebaseUser?.uid || 'anonymous',
        branchId: assignedBranchId.toString()
      });

      setOrderId(orderId);
      addPurchaseHistory(cart);
      setIsLoading(false);

      if (method !== 'cod' && method !== 'bank_transfer') {
        setInitialPaymentMethod(method as any);
        setShowPaymentGateway(true);
      } else {
        setCheckoutStep('success');
      }
    } catch (err) {
      setIsLoading(false);
      addToast(t('cart.orderFailed'), 'error');
    }
  };

  const [initialPaymentMethod, setInitialPaymentMethod] = useState<'visa' | 'paypal' | 'mada' | 'mada'>('visa');

  const handleGatewaySuccess = async (txnId: string) => {
    setShowPaymentGateway(false);
    if (orderId) {
      try {
        await updateOrder(orderId, {
          paymentStatus: 'paid',
          trackingNumber: txnId
        });
      } catch (err) {
        console.error('Failed to update payment status:', err);
      }
    }
    setCheckoutStep('success');
  };

  const resetIdentity = () => {
    localStorage.removeItem(REMEMBERED_PHONE_KEY);
    setPhone('');
    setCheckoutStep('phone');
  };

  useEffect(() => {
    if (checkoutStep === 'success' && orderId && !showMapModal) {
      const timer = setTimeout(() => {
        if (user?.role === 'admin' || user?.role === 'developer') {
          setPage('admin_dashboard' as any);
          addToast(t('cart.redirectDashboard'), 'info');
        } else {
          setPage('track' as any);
          addToast(t('cart.redirectTrack'), 'info');
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [checkoutStep, orderId, user, setPage, language, showMapModal]);

  if (checkoutStep === 'success') {
    return (
      <div
        className="container mx-auto px-4 py-12 md:py-20 text-black"
      >
        <OrderConfirmationMapModal
          isOpen={showMapModal}
          onClose={() => {
            setShowMapModal(false);
            addToast(language === 'ar' ? 'تم تأكيد موقع التوصيل بنجاح!' : 'Delivery location confirmed successfully!', 'success');
          }}
          orderId={orderId}
          lang={language as any}
        />
        <div className="bg-white p-8 md:p-24 rounded-3xl md:rounded-[5rem] shadow-sovereign max-w-4xl mx-auto text-center border-t-[15px] md:border-t-[30px] border-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-primary/5 blur-3xl rounded-full"></div>
          <div
            className="w-24 h-24 md:w-40 md:h-40 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 md:mb-12 border-4 md:border-8 border-green-100 shadow-inner"
          >
            <svg className="w-12 h-12 md:w-24 md:h-24 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl md:text-6xl font-black text-primary mb-4 md:mb-6 tracking-tighter uppercase">{t('cart.checkout.successTitle')}</h1>
          <p className="text-lg md:text-3xl text-gray-400 font-bold mb-8 md:mb-16 leading-relaxed">{t('cart.checkout.successSubtitle')}</p>

          <div
            className="bg-gray-50 p-8 md:p-12 rounded-2xl md:rounded-[3.5rem] mb-8 md:mb-16 border-2 md:border-4 border-gray-100 shadow-inner flex flex-col items-center"
          >
            <p className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.5em] mb-4 md:mb-6">{t('cart.checkout.orderId')}</p>
            <p className="text-3xl md:text-6xl font-mono font-black text-primary tracking-widest break-all">{orderId}</p>
          </div>

          {/* Bank Details for Bank Transfer */}
          {selectedPaymentMethod === 'bank_transfer' && (
            <div className="bg-orange-50 p-8 md:p-12 rounded-2xl md:rounded-[3.5rem] mb-8 md:mb-16 border-2 md:border-4 border-orange-100 text-right">
              <h3 className="text-xl md:text-3xl font-black text-primary mb-6 border-b border-orange-200 pb-4 flex items-center gap-4">
                <span>🏛️</span>
                {t('checkout.bankDetails')}
              </h3>
              <div className="space-y-4 md:space-y-6">
                <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl">
                  <span className="text-gray-500 font-bold">{t('cart.bankInfo.bank')}</span>
                  <span className="text-primary font-black">{COMPANY_INFO.bank.name}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl">
                  <span className="text-gray-500 font-bold">{t('cart.bankInfo.branch')}</span>
                  <span className="text-primary font-black">{COMPANY_INFO.bank.branch}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl">
                  <span className="text-gray-500 font-bold">{t('cart.bankInfo.idNo')}</span>
                  <span className="text-primary font-black font-mono">{COMPANY_INFO.bank.id_number}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl">
                  <span className="text-gray-500 font-bold">{t('cart.bankInfo.accountName')}</span>
                  <span className="text-primary font-black">{COMPANY_INFO.bank.account_name}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl">
                  <span className="text-gray-500 font-bold">{t('cart.bankInfo.accountNumber')}</span>
                  <span className="text-primary font-black font-mono">{COMPANY_INFO.bank.account_number}</span>
                </div>
                <div className="flex justify-between items-center bg-white/50 p-4 rounded-xl border-t-2 border-orange-200 mt-2 pt-4">
                  <span className="text-gray-500 font-bold">{t('cart.bankInfo.iban')}</span>
                  <span className="text-primary font-black font-mono text-xs md:text-lg">{COMPANY_INFO.bank.iban}</span>
                </div>
              </div>
              <p className="mt-8 text-sm md:text-lg text-orange-700 font-bold text-center">
                {t('cart.bankInfo.transferInstruction')}
              </p>
            </div>
          )}

          {import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
            <div className="mb-12">
              <FleetRadar orderId={orderId} apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <a
              href={`https://wa.me/${COMPANY_INFO.whatsapp}?text=Confirm%20Order%20${orderId}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-4 md:gap-6 bg-green-500 text-white font-black py-5 md:py-8 rounded-2xl md:rounded-[2.5rem] text-xl md:text-3xl hover:bg-green-600 transition-all shadow-4xl border-b-4 md:border-b-[10px] border-green-700 active:translate-y-1 md:active:translate-y-2 active:border-b-0"
            >
              💬 {t('cart.checkout.whatsappConfirmation')}
            </a>
            <button
              onClick={() => { clearCart(); setCheckoutStep('cart'); setPage('home'); }} className="bg-slate-100 text-slate-400 font-black py-5 md:py-8 rounded-2xl md:rounded-[2.5rem] text-lg md:text-2xl hover:bg-primary hover:text-white transition-all shadow-xl"
            >
              {t('cart.checkout.backToStore')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto px-4 md:px-6 py-12 md:py-24 text-black selection:bg-secondary selection:text-white"
    >
      {showPaymentGateway && (
        <PaymentPortal
          amount={totalWithVat}
          orderId={orderId}
          initialMethod={initialPaymentMethod}
          onCancel={() => setShowPaymentGateway(false)}
          onSuccess={handleGatewaySuccess}
        />
      )}

      {checkoutStep === 'cart' && (
        <div
          className="max-w-[1400px] mx-auto"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-10 mb-12 md:mb-20">
            <div className="space-y-2 md:space-y-4">
              <h1 className="text-4xl md:text-7xl font-black text-primary tracking-tighter uppercase">{t('cart.title')}</h1>
              <p className="text-xl md:text-3xl font-bold text-gray-400 italic border-r-4 md:border-r-8 border-secondary pr-4 md:pr-6 leading-none">{t('cart.qualityPledge')}</p>
            </div>
            {cart.length > 0 && <button onClick={clearCart} className="bg-red-50 text-red-500 px-8 md:px-12 py-3 md:py-5 rounded-xl md:rounded-[2rem] font-black text-lg md:text-xl hover:bg-red-500 hover:text-white transition-all shadow-lg">{t('cart.clear')}</button>}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-24 md:py-44 bg-gray-50 rounded-3xl md:rounded-[6rem] border-4 md:border-8 border-dashed border-gray-100 shadow-inner">
              <div className="text-6xl md:text-[12rem] mb-8 md:mb-12 opacity-10 grayscale scale-x-[-1]">🛒</div>
              <p className="text-2xl md:text-4xl font-black text-gray-300 uppercase tracking-[0.2em] md:tracking-[0.4em] mb-8 md:mb-12">{t('cart.empty')}</p>
              <button onClick={() => setPage('products')} className="bg-primary text-white font-black py-5 md:py-8 px-12 md:px-24 rounded-2xl md:rounded-[2.5rem] text-xl md:text-3xl shadow-4xl hover:scale-105 transition-all">
                {t('cart.continueShopping')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-16">
              <div className="xl:col-span-8 space-y-6 md:space-y-10">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-6 md:p-10 rounded-2xl md:rounded-[4rem] shadow-2xl border border-gray-50 flex flex-col md:flex-row items-center gap-6 md:gap-12 group hover:border-primary/10 transition-all relative"
                  >
                    <div className="w-32 h-32 md:w-44 md:h-44 rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl flex-shrink-0 border-2 md:border-4 border-white">
                      <img 
                        src={item.image} 
                        alt={item.name_ar} 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/official_logo.png?v=2026'; }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                    </div>
                    <div className="flex-grow text-center md:text-right space-y-1 md:space-y-2">
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{t(`categories.${item.category}`)}</span>
                      <h3 className="text-xl md:text-3xl font-black text-slate-800 leading-tight">{language === 'ar' ? item.name_ar : item.name_en}</h3>
                      <p className="text-primary font-bold text-lg md:text-xl">{formatCurrency(item.price)} <span className="text-gray-400 text-xs md:text-sm">/ {language === 'ar' ? item.unit_ar : item.unit_en}</span></p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full md:w-auto">
                      <div className="bg-gray-50 p-2 md:p-3 rounded-xl md:rounded-[2.5rem] flex items-center gap-6 md:gap-8 border border-gray-100 shadow-inner">
                        {(() => {
                          const isWeight = item.unit_en?.toLowerCase().includes('kg') || item.unit_ar?.includes('كيلو');
                          const step = isWeight ? 0.5 : 1;
                          return (
                            <>
                              <button onClick={() => updateQuantity(item.id, Math.max(step, item.quantity - step))} className="w-10 h-10 md:w-14 md:h-14 bg-white shadow-xl rounded-lg md:rounded-2xl font-black text-xl md:text-3xl hover:bg-primary hover:text-white transition-all transform active:scale-90">-</button>
                              <span className="font-black text-xl md:text-3xl min-w-[2rem] md:min-w-[3rem] text-center text-primary">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, item.quantity + step)} className="w-10 h-10 md:w-14 md:h-14 bg-white shadow-xl rounded-lg md:rounded-2xl font-black text-xl md:text-3xl hover:bg-primary hover:text-white transition-all transform active:scale-90">+</button>
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-center md:text-right min-w-[120px] md:min-w-[160px]">
                        <p className="text-2xl md:text-4xl font-black text-primary">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-4 md:p-6 text-gray-300 hover:text-red-500 transition-all"><TrashIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="xl:col-span-4">
                <div
                  className="bg-primary text-white p-8 md:p-12 rounded-3xl md:rounded-[5rem] shadow-4xl sticky top-36 border-b-[15px] md:border-b-[30px] border-secondary overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-white/5 blur-3xl rounded-full"></div>
                  <h2 className="text-2xl md:text-4xl font-black mb-8 md:mb-12 border-b border-white/10 pb-6 md:pb-8 flex items-center gap-4 md:gap-6">
                    <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 text-secondary animate-pulse" />
                    {t('cart.summary')}
                  </h2>
                  <div className="space-y-6 md:space-y-8 mb-12 md:mb-16">
                    <div className="flex justify-between font-bold text-lg md:text-2xl opacity-60"><span>{t('cart.items_value')}</span><span>{formatCurrency(subtotal)}</span></div>

                    {/* Coupon Input */}
                    <div className="flex gap-3 md:gap-4">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder={t('cart.couponCodeLabel')}
                        className="flex-grow bg-white/10 border border-white/20 rounded-lg md:rounded-xl px-4 py-2 text-white placeholder:text-white/40 outline-none focus:border-secondary text-sm md:text-base"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        className="bg-secondary px-4 md:px-6 py-2 rounded-lg md:rounded-xl font-black text-xs md:text-sm hover:bg-white hover:text-secondary transition-all"
                      >
                        {t('cart.apply')}
                      </button>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between font-bold text-lg md:text-2xl text-secondary">
                        <span>{t('cart.discount')} ({appliedCoupon.code})</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-bold text-lg md:text-2xl opacity-60">
                      <span>{t('cart.deliveryFeeLabel')}</span>
                      <span>{shippingFee === 0 ? t('cart.freeLabel') : formatCurrency(shippingFee)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-lg md:text-2xl opacity-60"><span>{t('cart.vat')}</span><span>{formatCurrency((subtotal - discountAmount + shippingFee) * 0.15)}</span></div>

                    <div className="bg-white/10 p-4 rounded-xl md:rounded-2xl border border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-xs md:text-sm font-bold opacity-80">{t('cart.cashbackEarnedLabel')}</span>
                        <span className="text-lg md:text-xl font-black text-secondary">+{formatCurrency(cashbackEarned)}</span>
                      </div>
                    </div>

                    <div className="pt-6 md:pt-10 border-t border-white/20 flex justify-between items-center">
                      <span className="text-xl md:text-3xl font-black">{t('cart.grandTotalLabel')}</span>
                      <span className="text-3xl md:text-6xl font-black text-secondary">{formatCurrency(totalWithVat)}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleStartCheckout} className="w-full py-6 md:py-10 bg-secondary text-white rounded-2xl md:rounded-[3rem] font-black text-2xl md:text-4xl shadow-4xl transition-all border-b-8 md:border-b-[15px] border-orange-800 uppercase tracking-tighter"
                  >
                    ✅ {t('cart.finalizeCheckout')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {checkoutStep === 'phone' && (
        <div
          className="max-w-3xl mx-auto bg-white p-5 sm:p-8 md:p-24 rounded-2xl sm:rounded-3xl md:rounded-[6rem] shadow-sovereign border-t-[10px] md:border-t-[25px] border-primary"
        >
          <div className="text-center mb-8 md:mb-16">
            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 md:mb-10 text-primary border-2 md:border-4 border-primary/10 shadow-inner">
              <PhoneIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-primary mb-2 sm:mb-4 tracking-tighter">{t('checkout.phoneStep')}</h2>
            <p className="text-sm sm:text-lg md:text-2xl text-gray-400 font-bold max-w-lg mx-auto leading-relaxed">{t('checkout.phoneVerificationSubtitle')}</p>
          </div>
          <div className="space-y-6 md:space-y-12">
            <div className="relative group">
              <input type="tel" placeholder={t('checkout.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-4 sm:p-6 md:p-10 bg-gray-50 border-2 sm:border-4 md:border-[6px] border-gray-100 rounded-xl sm:rounded-2xl md:rounded-[3rem] font-black text-xl sm:text-3xl md:text-5xl text-center focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
              <div className="absolute left-4 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <SaudiFlag className="w-8 h-6 sm:w-10 sm:h-7 rounded shadow-md border border-emerald-600/30" />
                <span className="font-black text-lg sm:text-2xl text-primary">+966</span>
              </div>
            </div>
            <button
              onClick={handleSendOtp} disabled={isLoading || waitTimer > 0} className="w-full py-4 sm:py-6 md:py-10 bg-primary text-white rounded-xl sm:rounded-2xl md:rounded-[3rem] font-black text-lg sm:text-2xl md:text-4xl shadow-4xl transition-all disabled:opacity-50"
            >
              {isLoading ? t('checkout.sendingOtp') : waitTimer > 0 ? t('checkout.resendOtp', { timer: waitTimer }) : t('checkout.sendCode')}
            </button>
          </div>
        </div>
      )}

      {checkoutStep === 'otp' && (
        <div
          className="max-w-3xl mx-auto bg-white p-5 sm:p-8 md:p-24 rounded-2xl sm:rounded-3xl md:rounded-[6rem] shadow-sovereign border-t-[10px] md:border-t-[25px] border-secondary text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-primary mb-2 sm:mb-6 tracking-tighter">{t('checkout.otpStep')}</h2>
          <p className="text-sm sm:text-lg md:text-2xl text-gray-400 font-bold mb-6 sm:mb-16 leading-relaxed">{t('checkout.otpSubtitle')}</p>
          <input type="text" maxLength={6} placeholder="0 0 0 0 0 0" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="w-full p-4 sm:p-8 md:p-12 bg-gray-50 border-2 sm:border-4 md:border-[6px] border-gray-100 rounded-xl sm:rounded-2xl md:rounded-[3rem] font-black text-xl sm:text-5xl md:text-8xl text-center tracking-[0.1em] sm:tracking-[0.2em] md:tracking-[0.5em] focus:border-secondary focus:bg-white outline-none transition-all mb-6 sm:mb-12 shadow-inner text-primary" />
          <button
            onClick={handleVerifyOtp} disabled={isLoading} className="w-full py-4 sm:py-6 md:py-10 bg-secondary text-white rounded-xl sm:rounded-2xl md:rounded-[3rem] font-black text-lg sm:text-2xl md:text-4xl shadow-4xl transition-all"
          >
            {isLoading ? t('checkout.verifyingOtp') : t('checkout.verifyCode')} 🛡️
          </button>
          <button onClick={() => setCheckoutStep('phone')} className="block mx-auto mt-4 sm:mt-8 text-primary font-black text-sm sm:text-lg underline opacity-50">{t('checkout.changePhone')}</button>
        </div>
      )}

      {checkoutStep === 'address' && (
        <div
          className="max-w-5xl mx-auto bg-white p-5 sm:p-8 md:p-24 rounded-2xl sm:rounded-3xl md:rounded-[6rem] shadow-sovereign border-t-[10px] md:border-t-[30px] border-primary"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 mb-8 md:mb-20 border-b-2 border-gray-50 pb-6 md:pb-12">
            <div className="bg-primary p-4 md:p-8 rounded-xl md:rounded-[3rem] text-white shadow-4xl transform -rotate-3"><LocationMarkerIcon className="w-8 h-8 md:w-20 md:h-20" /></div>
            <div className="flex-grow text-center md:text-right">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-primary uppercase tracking-tighter mb-1 md:mb-2">{t('checkout.addressStep')}</h2>
                  <p className="text-sm sm:text-lg md:text-2xl text-gray-400 font-bold">{t('checkout.addressSubtitle')}</p>
                </div>
                {localStorage.getItem(REMEMBERED_PHONE_KEY) && (
                  <button onClick={resetIdentity} className="text-[10px] md:text-xs font-black text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all">
                    {t('checkout.changePhone')}
                  </button>
                )}
              </div>
            </div>
          </div>
          <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12">
            <input required type="text" value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="w-full p-4 sm:p-6 md:p-8 bg-gray-50 border-2 border-gray-100 rounded-xl md:rounded-[2.5rem] font-black text-lg md:text-2xl focus:border-primary outline-none" placeholder={t('checkout.city')} />
            <input required type="text" value={address.district} onChange={e => setAddress({ ...address, district: e.target.value })} className="w-full p-4 sm:p-6 md:p-8 bg-gray-50 border-2 border-gray-100 rounded-xl md:rounded-[2.5rem] font-black text-lg md:text-2xl focus:border-primary outline-none" placeholder={t('checkout.district')} />
            <input required type="text" value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="w-full p-4 sm:p-6 md:p-8 bg-gray-50 border-2 border-gray-100 rounded-xl md:rounded-[2.5rem] font-black text-lg md:text-2xl focus:border-primary outline-none md:col-span-2" placeholder={t('checkout.street')} />
            <button
              type="submit" className="w-full py-4 sm:py-6 md:py-10 bg-primary text-white rounded-xl sm:rounded-2xl md:rounded-[3.5rem] font-black text-lg sm:text-2xl md:text-4xl shadow-4xl transition-all md:col-span-2 border-b-4 md:border-b-[15px] border-primary-dark"
            >
              {t('checkout.confirmAddress')}
            </button>
          </form>
        </div>
      )}

      {checkoutStep === 'delivery' && (
        <div className="max-w-5xl mx-auto bg-white p-5 sm:p-8 md:p-24 rounded-2xl sm:rounded-3xl md:rounded-[6rem] shadow-sovereign border-t-[10px] md:border-t-[30px] border-secondary">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-primary mb-2 sm:mb-4 tracking-tighter uppercase">{t('cart.deliveryMode.title')}</h2>
            <p className="text-sm sm:text-lg md:text-2xl text-gray-400 font-bold">{t('cart.deliveryMode.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-16">
            {(['standard', 'express', 'scheduled'] as DeliveryMethod[]).map((method) => (
              <div
                key={method}
                onClick={() => setDeliveryMethod(method)}
                className={`p-4 sm:p-6 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[3rem] border-2 md:border-4 cursor-pointer transition-all flex flex-col items-center text-center group ${deliveryMethod === method ? 'border-secondary bg-secondary/5 shadow-xl' : 'border-gray-100 hover:border-secondary/30'
                  }`}
              >
                <div className="text-3xl sm:text-4xl md:text-6xl mb-2 sm:mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  {method === 'standard' ? '🚚' : method === 'express' ? '⚡' : '📅'}
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-primary mb-1 sm:mb-2">
                  {t(`cart.deliveryMode.${method}`)}
                </h3>
                <p className="text-xs sm:text-sm md:text-gray-400 font-bold">
                  {method === 'standard' ? t('cart.deliveryMode.within24h') :
                    method === 'express' ? t('cart.deliveryMode.within2h') :
                      t('cart.deliveryMode.pickTime')}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={handleDeliverySubmit}
            className="w-full py-4 sm:py-6 md:py-10 bg-secondary text-white rounded-xl sm:rounded-2xl md:rounded-[3.5rem] font-black text-lg sm:text-2xl md:text-4xl shadow-4xl transition-all border-b-4 md:border-b-[15px] border-orange-800"
          >
            {t('cart.deliveryMode.confirm')}
          </button>
        </div>
      )}

      {checkoutStep === 'payment' && (
        <div
          className="max-w-6xl mx-auto space-y-6 md:space-y-16"
        >
          <div className="bg-primary text-white p-5 sm:p-8 md:p-16 rounded-2xl sm:rounded-3xl md:rounded-[6rem] shadow-4xl flex flex-col md:flex-row justify-between items-center relative overflow-hidden border-b-[10px] md:border-b-[30px] border-secondary gap-4">
            <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-96 h-32 sm:h-48 md:h-96 bg-white/5 blur-3xl rounded-full"></div>
            <h2 className="text-xl sm:text-3xl md:text-5xl font-black uppercase tracking-tighter relative z-10">{t('checkout.paymentStep')}</h2>
            <p className="text-secondary font-black text-xl sm:text-2xl md:text-3xl relative z-10">{formatCurrency(totalWithVat)}</p>
          </div>

          {user?.role === 'vip' ? (
            <div className="bg-slate-950 border-[3px] border-amber-500 rounded-3xl p-6 sm:p-10 md:p-16 shadow-2xl relative overflow-hidden text-right">
              {/* VIP/Corporate Sovereign Badge */}
              <div className="absolute top-0 left-0 bg-amber-500 text-slate-950 px-6 py-2 rounded-br-2xl font-black uppercase tracking-widest text-[9px] md:text-[11px]">
                {language === 'ar' ? 'بوابة كبار العملاء المعزولة VIP' : 'Sovereign VIP Isolated Portal'}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 mb-8 md:mb-12">
                <span className="text-4xl md:text-6xl">💎</span>
                <div>
                  <h3 className="text-2xl md:text-4xl font-black text-amber-500">
                    {language === 'ar' ? 'طلب توريد للشركات وكبار العملاء (VIP)' : 'Corporate & VIP Supply Order'}
                  </h3>
                  <p className="text-slate-300 text-xs md:text-base font-bold mt-2">
                    {language === 'ar' ? 'تم تفعيل نظام دفع آمن ومعزول تماماً ومباشر مع حساب البنك العربي الوطني المسجل دون المرور ببوابة ميسر.' : 'An isolated, highly secure payment system is activated directly with the registered Arab National Bank (ANB) account, completely bypassing Moyasar gateway.'}
                  </p>
                </div>
              </div>

              {/* Bank Card representation */}
              <div className="bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 p-6 md:p-10 rounded-2xl shadow-xl max-w-xl mx-auto mb-8 md:mb-12 border border-white/20">
                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] opacity-85">{language === 'ar' ? 'البنك العربي الوطني' : 'Arab National Bank (ANB)'}</p>
                <p className="text-lg sm:text-2xl md:text-3xl font-black font-mono tracking-widest my-4 sm:my-6">SA43 4000 0000 1234 5678 9012</p>
                <div className="flex justify-between items-center text-[10px] md:text-xs font-black">
                  <span>{language === 'ar' ? 'مؤسسة نجوم دلتا للتجارة' : 'Delta Stars Trading'}</span>
                  <span className="font-mono">ANB-VIP-01</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => handleFinalOrder('bank_transfer')}
                  className="px-10 py-4 md:px-16 md:py-6 bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all rounded-full font-black text-base md:text-2xl shadow-2xl hover:scale-105 active:scale-95"
                >
                  🚀 {language === 'ar' ? 'تأكيد وإرسال طلب التوريد الآجل' : 'Confirm & Place Supply Order'}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              <div
                onClick={() => handleFinalOrder('visa')} className="bg-white p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[4rem] shadow-sovereign border-2 md:border-4 border-transparent hover:border-primary transition-all flex flex-col items-center text-center cursor-pointer group animate-fade-in"
              >
                <div className="w-full flex flex-col items-center gap-2 mb-4 md:mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2 w-full justify-center">
                    <MoyasarLogo className="h-4 sm:h-5 shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'البوابة المالية المعتمدة 🇸🇦' : 'Approved Gateway 🇸🇦'}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-xs mt-1">
                    <MadaLogo className="h-5 sm:h-6" />
                    <VisaLogo className="h-3.5 sm:h-4" />
                    <MastercardLogo className="h-4 sm:h-5" />
                    <ApplePayLogo className="h-4 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1 sm:mb-4">{t('cart.paymentOptions.creditCard')}</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-4 sm:mb-8">Visa / Mastercard / Mada / Apple Pay</p>
                <button className="mt-auto w-full py-3 md:py-6 bg-primary text-white rounded-lg md:rounded-[2rem] font-black text-sm md:text-xl">{t('cart.paymentOptions.selectCredit')}</button>
              </div>
              <div
                onClick={() => handleFinalOrder('bank_transfer')} className="bg-white p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[4rem] shadow-sovereign border-2 md:border-4 border-transparent hover:border-secondary transition-all flex flex-col items-center text-center cursor-pointer group animate-fade-in"
              >
                <div className="w-full flex flex-col gap-1 items-center justify-center mb-4 md:mb-8 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-xl sm:text-2xl mb-1">🏦</div>
                  <div className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'البنوك السعودية المعتمدة' : 'Approved Saudi Banks'}</div>
                  <div className="flex gap-1 flex-wrap justify-center mt-1">
                    <span className="text-[8px] sm:text-[9px] bg-emerald-800 text-white font-black px-1.5 py-0.5 rounded">العربي ANB</span>
                    <span className="text-[8px] sm:text-[9px] bg-blue-700 text-white font-black px-1.5 py-0.5 rounded">الراجحي</span>
                    <span className="text-[8px] sm:text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.5 rounded">الأهلي SNB</span>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1 sm:mb-4">{t('cart.paymentOptions.bankTransfer')}</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-4 sm:mb-8">{t('cart.bankInfo.bankDetails')}</p>
                <button className="mt-auto w-full py-3 md:py-6 bg-secondary text-white rounded-lg md:rounded-[2rem] font-black text-sm md:text-xl">{t('cart.paymentOptions.selectBank')}</button>
              </div>
              <div
                onClick={() => handleFinalOrder('paypal')} className="bg-white p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[4rem] shadow-sovereign border-2 md:border-4 border-transparent hover:border-blue-500 transition-all flex flex-col items-center text-center cursor-pointer group animate-fade-in"
              >
                <div className="w-full flex items-center justify-center mb-4 md:mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <PayPalLogo className="h-5 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1 sm:mb-4">{t('cart.paymentOptions.paypal')}</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-4 sm:mb-8">{t('cart.paymentOptions.safePaypal')}</p>
                <button className="mt-auto w-full py-3 md:py-6 bg-blue-600 text-white rounded-lg md:rounded-[2rem] font-black text-sm md:text-xl">{t('cart.paymentOptions.selectPaypal')}</button>
              </div>
              <div
                onClick={() => handleFinalOrder('tamara')} className="bg-white p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[4rem] shadow-sovereign border-2 md:border-4 border-transparent hover:border-amber-500 transition-all flex flex-col items-center text-center cursor-pointer group animate-fade-in"
              >
                <div className="w-full flex items-center justify-center mb-4 md:mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <TamaraLogo className="h-5 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1 sm:mb-4">تمارا (قسطها)</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-4 sm:mb-8">قسط مشترياتك على دفعات</p>
                <button className="mt-auto w-full py-3 md:py-6 bg-amber-600 text-white rounded-lg md:rounded-[2rem] font-black text-sm md:text-xl">{t('cart.paymentOptions.selectTamara', 'Select Tamara')}</button>
              </div>
              <div
                onClick={() => handleFinalOrder('tabby')} className="bg-white p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[4rem] shadow-sovereign border-2 md:border-4 border-transparent hover:border-green-400 transition-all flex flex-col items-center text-center cursor-pointer group animate-fade-in"
              >
                <div className="w-full flex items-center justify-center mb-4 md:mb-8 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <TabbyLogo className="h-5 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1 sm:mb-4">تابي (4 دفعات)</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-4 sm:mb-8">بدون فوائد ولا رسوم إضافية</p>
                <button className="mt-auto w-full py-3 md:py-6 bg-green-600 text-white rounded-lg md:rounded-[2rem] font-black text-sm md:text-xl">{t('cart.paymentOptions.selectTabby', 'Select Tabby')}</button>
              </div>
              <div
                onClick={() => handleFinalOrder('cod')} className="bg-white p-5 sm:p-8 md:p-10 rounded-xl sm:rounded-2xl md:rounded-[4rem] shadow-sovereign border-2 md:border-4 border-transparent hover:border-slate-900 transition-all flex flex-col items-center text-center cursor-pointer group"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-gray-50 rounded-xl md:rounded-[2rem] flex items-center justify-center mb-4 md:mb-8 text-2xl sm:text-3xl md:text-5xl group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800 mb-1 sm:mb-4">{t('cart.paymentOptions.cod')}</h3>
                <p className="text-[10px] text-gray-400 font-bold mb-4 sm:mb-8">{t('cart.paymentOptions.codDesc')}</p>
                <button className="mt-auto w-full py-3 md:py-6 bg-slate-900 text-white rounded-lg md:rounded-[2rem] font-black text-sm md:text-xl">{t('cart.paymentOptions.selectCod')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CartPage;
