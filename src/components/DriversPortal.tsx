import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFirebase, useI18n, useToast } from './lib/contexts';
import { db, collection, query, onSnapshot, updateDoc, doc, where, addDoc, getDocs } from '@/firebase';
import { 
  TruckIcon, PackageIcon, MapPinIcon, CheckCircleIcon, ClockIcon, PhoneIcon,
  NavigationIcon, ShieldCheckIcon
} from './lib/contexts/Icons';
import BranchMap from './BranchMap';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriversPortal() {
  const { language, formatCurrency } = useI18n();
  const { addToast } = useToast();
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Form & Auth States
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [portalAuthCode, setPortalAuthCode] = useState('');
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [showBiometricAnimation, setShowBiometricAnimation] = useState(false);
  const [isForceChangePin, setIsForceChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  // Portal States
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'dispatches' | 'finance' | 'map' | 'contracts'>('dispatches');
  const [localOrders, setLocalOrders] = useState<any[]>([]);
  const [knownOrderIds, setKnownOrderIds] = useState<string[]>([]);

  // Signature / Customer Review Modal States
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState<any | null>(null);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const [customerFeedback, setCustomerFeedback] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Biometrics simulation check on load
  useEffect(() => {
    const savedUser = localStorage.getItem('ds_drivers_portal_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      setIsBiometricEnrolled(localStorage.getItem(`biometrics_${parsed.id}`) === 'true');
    }
  }, []);

  // Listen to orders assigned to the logged-in driver/delegate
  useEffect(() => {
    if (!currentUser || !db) return;

    const q = query(collection(db, 'orders'));
    const unsub = onSnapshot(q, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter orders assigned to this user
      const filtered = allOrders.filter((o: any) => o.driverId === currentUser.id || o.assignedDriverId === currentUser.id);
      setLocalOrders(filtered);
    }, (err) => {
      console.error("Error loading driver orders:", err);
    });

    return () => unsub();
  }, [currentUser]);

  // Audio Playback & Text-to-Speech Notification Engine
  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.3); // D6

      osc2.frequency.setValueAtTime(293.66, audioCtx.currentTime); // D4
      osc2.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.15); // A4
      osc2.frequency.exponentialRampToValueAtTime(587.33, audioCtx.currentTime + 0.3); // D5

      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.6);
      osc2.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn("Chime failed", e);
    }
  };

  const speakNotification = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Monitor for incoming active orders in real-time
  const activeOrders = useMemo(() => {
    return localOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  }, [localOrders]);

  useEffect(() => {
    if (activeOrders.length > 0 && currentUser) {
      const currentIds = activeOrders.map(o => o.id);
      if (knownOrderIds.length > 0) {
        const newOrders = currentIds.filter(id => !knownOrderIds.includes(id));
        if (newOrders.length > 0) {
          playChimeSound();
          const speechText = language === 'ar' 
            ? 'تنبيه عاجل: تم تعيين مهمة توريد وتوصيل جديدة في نطاق تخصصك، يرجى تلبية الطلب فوراً' 
            : 'Alert: A new logistics dispatch has been assigned to you. Please fulfill immediately.';
          speakNotification(speechText);
          addToast(
            language === 'ar' ? 'تنبيه: تم إسناد طلب جديد إليك بالوقت الفعلي 📦' : 'Alert: A new order assigned in real-time 📦',
            'success'
          );
        }
      }
      setKnownOrderIds(currentIds);
    }
  }, [activeOrders, currentUser]);

  // Auth Submit Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password || !portalAuthCode) {
      addToast(language === 'ar' ? 'يرجى إدخال رقم الجوال، كلمة المرور، ورمز التوثيق الإداري الفريد' : 'Please input phone, password, and secure administrative auth code', 'error');
      return;
    }

    try {
      // Find user with type='delegate' or 'driver' or general user matching this phone
      const q = query(collection(db, 'users'), where('phone', '==', phone));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        addToast(language === 'ar' ? 'رقم الهاتف غير مسجل بالنظام' : 'Phone number not registered', 'error');
        return;
      }

      let foundUser: any = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'delegate' || data.role === 'driver' || data.type === 'driver') {
          foundUser = { id: doc.id, ...data };
        }
      });

      if (!foundUser) {
        addToast(language === 'ar' ? 'رقم الهاتف لا يملك صلاحية دخول كمنسق أو مندوب توصيل' : 'No driver/delegate access permissions', 'error');
        return;
      }

      // Check Administrative Authorization Token (Sovereign requirement)
      if (!foundUser.portal_auth_code) {
        addToast(language === 'ar' ? 'تنبيه أمان: هذا الحساب غير مفوض برمز دخول آمن من لوحة التحكم. يرجى مراجعة إدارة دلتا نجوم لتوليد رمزك.' : 'Security Alert: This account does not have a secure entry token generated yet. Please contact administration.', 'error');
        return;
      }

      if (foundUser.portal_auth_code.trim().toUpperCase() !== portalAuthCode.trim().toUpperCase()) {
        addToast(language === 'ar' ? 'رمز التوثيق الإداري المدخل غير صحيح أو انتهت صلاحيته' : 'The secure administrative authorization code is incorrect', 'error');
        return;
      }

      // Check if user is suspended
      if (foundUser.delegateStatus === 'inactive' || foundUser.clientStatus === 'inactive') {
        addToast(language === 'ar' ? 'تم تعليق هذا الحساب من قبل المطور والإدارة العامة' : 'This account has been suspended by the developer and general administration', 'error');
        return;
      }

      // Check Password (defaults to 654321)
      const userPin = foundUser.security_pin || '654321';
      if (password !== userPin) {
        addToast(language === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid PIN or password', 'error');
        return;
      }

      // If password is the default pin, force change password
      if (password === '654321') {
        setIsForceChangePin(true);
        setCurrentUser(foundUser); // set temp to update
        addToast(language === 'ar' ? 'تنبيه أمان: يرجى استبدال كلمة المرور الافتراضية بكلمة مرور جديدة وآمنة' : 'Security Alert: Please change your default password', 'warning');
        return;
      }

      // Successful login
      setCurrentUser(foundUser);
      localStorage.setItem('ds_drivers_portal_user', JSON.stringify(foundUser));
      setIsBiometricEnrolled(localStorage.getItem(`biometrics_${foundUser.id}`) === 'true');
      addToast(language === 'ar' ? 'تم تسجيل الدخول وتوثيق الرمز الإداري بنجاح 🔒' : 'Administrative verification successful. Logged in 🔒', 'success');
    } catch (err) {
      console.error(err);
      addToast(language === 'ar' ? 'حدث خطأ في الاتصال بالشبكة' : 'Network error during login', 'error');
    }
  };

  // Simulating the fingerprint login with biometrics
  const handleBiometricLogin = () => {
    const savedUser = localStorage.getItem('ds_drivers_portal_user');
    if (!savedUser) {
      addToast(language === 'ar' ? 'الرجاء تسجيل الدخول بكلمة المرور أولاً لتفعيل البصمة' : 'Please log in with password first to enroll fingerprint', 'info');
      return;
    }

    const parsed = JSON.parse(savedUser);
    const isEnrolled = localStorage.getItem(`biometrics_${parsed.id}`) === 'true';
    if (!isEnrolled) {
      addToast(language === 'ar' ? 'لم يتم تفعيل البصمة لهذا الحساب بعد' : 'Fingerprint not enrolled for this account', 'warning');
      return;
    }

    setShowBiometricAnimation(true);
    setTimeout(async () => {
      // Fetch latest profile from database to verify active status
      try {
        const userDoc = await getDocs(query(collection(db, 'users'), where('phone', '==', parsed.phone)));
        let latestUser: any = null;
        userDoc.forEach(doc => {
          latestUser = { id: doc.id, ...doc.data() };
        });

        if (latestUser && (latestUser.delegateStatus === 'inactive' || latestUser.clientStatus === 'inactive')) {
          addToast(language === 'ar' ? 'تم إيقاف حسابك من كونسول المطور' : 'Your account has been suspended from the Dev Console', 'error');
          setShowBiometricAnimation(false);
          return;
        }

        setCurrentUser(parsed);
        setIsBiometricEnrolled(true);
        addToast(language === 'ar' ? 'تم التحقق من البصمة ودخول البوابة بنجاح 🔒' : 'Fingerprint authorized. Access granted 🔒', 'success');
      } catch {
        setCurrentUser(parsed);
      }
      setShowBiometricAnimation(false);
    }, 2000);
  };

  // Enrolling biometrics for quick touch ID login
  const toggleBiometricEnrollment = () => {
    if (!currentUser) return;
    const nextVal = !isBiometricEnrolled;
    setIsBiometricEnrolled(nextVal);
    localStorage.setItem(`biometrics_${currentUser.id}`, nextVal ? 'true' : 'false');
    addToast(
      language === 'ar' 
        ? (nextVal ? 'تم تفعيل الدخول السريع بالبصمة الحيوية بنجاح' : 'تم إلغاء تفعيل البصمة') 
        : (nextVal ? 'Biometric fingerprint login activated' : 'Biometric credential disabled'),
      'success'
    );
  };

  // Handle password changing (Force default pin replacement)
  const handleForceChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin || !confirmNewPin) {
      addToast(language === 'ar' ? 'يرجى إدخال جميع الحقول' : 'Please fill all fields', 'error');
      return;
    }
    if (newPin === '654321') {
      addToast(language === 'ar' ? 'لا يمكن اختيار كلمة المرور الافتراضية ككلمة مرور جديدة' : 'Cannot use the default PIN as your new password', 'error');
      return;
    }
    if (newPin !== confirmNewPin) {
      addToast(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', currentUser.id), {
        security_pin: newPin,
        force_password_change: false
      });
      
      const updatedUser = { ...currentUser, security_pin: newPin, force_password_change: false };
      setCurrentUser(updatedUser);
      localStorage.setItem('ds_drivers_portal_user', JSON.stringify(updatedUser));
      setIsForceChangePin(false);
      addToast(language === 'ar' ? 'تم تحديث كلمة المرور وتأمين البوابة بنجاح' : 'PIN updated and secured successfully', 'success');
    } catch (err) {
      addToast(language === 'ar' ? 'فشل تحديث كلمة المرور' : 'Failed to update PIN', 'error');
    }
  };

  // Sign out
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ds_drivers_portal_user');
    addToast(language === 'ar' ? 'تم الخروج الآمن وتشفير البيانات' : 'Signed out safely and data encrypted', 'info');
  };

  // Update order delivery statuses
  const handleUpdateStatus = async (orderId: string, status: string, extra = {}) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status, ...extra });
      addToast(
        language === 'ar' ? 'تم تحديث حالة الشحنة بالوقت الفعلي' : 'Shipment status updated in real-time',
        'success'
      );
    } catch {
      addToast('Error updating status', 'error');
    }
  };

  // Signature Canvas Helpers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2d5a27'; // Dark green
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
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureImg(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImg(null);
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

  // Complete delivery with customer signature and locked review feedback
  const handleCompleteDelivery = async () => {
    if (!signatureImg) {
      addToast(language === 'ar' ? 'يرجى تدوين توقيع المستلم لإثبات التسليم' : 'Please draw receiver signature to verify', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', activeDeliveryOrder.id), {
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        customerSignature: signatureImg,
        customerFeedback: customerFeedback.trim() || 'تم الاستلام بنجاح بدون ملاحظات',
        podVerified: true
      });

      // Also log user complaint automatically if it exists
      if (customerFeedback.trim()) {
        await addDoc(collection(db, 'driver_logs'), {
          orderId: activeDeliveryOrder.id,
          driverId: currentUser.id,
          driverName: currentUser.name || currentUser.full_name,
          feedback: customerFeedback.trim(),
          timestamp: new Date().toISOString(),
          type: 'customer_notes'
        });
      }

      addToast(language === 'ar' ? 'تم تسليم الطلب وإرسال التقرير للإدارة بنجاح' : 'Delivery verified and feedback locked!', 'success');
      setActiveDeliveryOrder(null);
      setSignatureImg(null);
      setCustomerFeedback('');
    } catch (err) {
      addToast('Error saving delivery report', 'error');
    }
  };

  // Financial calculations
  const totalCompleted = useMemo(() => {
    return localOrders.filter(o => o.status === 'delivered').length;
  }, [localOrders]);

  const totalCollectedCash = useMemo(() => {
    return localOrders
      .filter(o => o.status === 'delivered')
      .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  }, [localOrders]);

  const earnedCommission = useMemo(() => {
    // 15 SAR per delivery for Driver, 5% of order total for Delegate
    const isDriver = currentUser?.role === 'driver' || currentUser?.type === 'driver';
    if (isDriver) {
      return totalCompleted * 15;
    } else {
      return totalCollectedCash * 0.05;
    }
  }, [totalCompleted, totalCollectedCash, currentUser]);

  // View logic
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-tajawal text-right" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-6 relative overflow-hidden"
        >
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />

          <header className="text-center space-y-2 relative z-10">
            <div className="w-20 h-20 bg-green-950 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/5">
              <TruckIcon className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-2xl font-black text-white mt-4">
              {language === 'ar' ? 'بوابة المناديب والسواقين' : 'Drivers & Delegates Portal'}
            </h1>
            <p className="text-gray-400 text-xs font-bold">
              {language === 'ar' ? 'تسجيل دخول الكوادر الميدانية واللوجستية بمجموعة نجوم دلتا' : 'Field agents & logistics department secure terminal'}
            </p>
          </header>

          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-black text-green-400 mb-2 uppercase">
                {language === 'ar' ? 'رقم الجوال المسجل' : 'Registered Mobile'}
              </label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 05XXXXXXXX"
                className="w-full px-5 py-4 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:border-green-500 text-white font-bold text-sm text-center"
              />
            </div>

            <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
              <label className="block text-xs font-black text-amber-400 mb-2 uppercase flex items-center justify-center gap-1">
                <span>🔑</span>
                {language === 'ar' ? 'رمز التوثيق الإداري الآمن' : 'Secure Admin Token'}
              </label>
              <input 
                type="text" 
                value={portalAuthCode}
                onChange={(e) => setPortalAuthCode(e.target.value)}
                placeholder="DS-DRV-XXXXXX"
                className="w-full px-5 py-4 bg-slate-950/80 border border-amber-500/30 focus:border-amber-400 rounded-2xl outline-none text-amber-300 font-bold font-mono text-sm text-center tracking-wider"
              />
              <p className="text-[10px] text-slate-500 font-bold text-center mt-2 leading-relaxed">
                {language === 'ar' 
                  ? 'يرسل تلقائياً من لوحة التحكم بإشراف المطور والمسؤول المالي' 
                  : 'Managed and generated via the central administrator portal.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-black text-green-400 mb-2 uppercase">
                {language === 'ar' ? 'رقم المرور / PIN' : 'Password / PIN'}
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-5 py-4 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:border-green-500 text-white font-bold text-sm text-center tracking-widest"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-green-600/15"
            >
              {language === 'ar' ? 'دخول آمن للمنظومة 🔒' : 'Authorized Access 🔒'}
            </button>
          </form>

          <div className="border-t border-white/5 pt-4 flex flex-col items-center gap-3 relative z-10">
            <p className="text-gray-500 text-[10px] font-black uppercase text-center">
              {language === 'ar' ? 'أو الدخول السريع عبر القياسات الحيوية' : 'OR QUICK ACCESS VIA BIOMETRICS'}
            </p>
            <button 
              onClick={handleBiometricLogin}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 p-3 px-6 rounded-2xl font-bold text-xs transition-all"
            >
              <span className="text-xl">🔘</span>
              {language === 'ar' ? 'تفعيل الدخول بالبصمة' : 'Fingerprint Auth'}
            </button>
          </div>

          <footer className="text-center text-gray-600 text-[9px] font-bold">
            {language === 'ar' ? 'نظام مشفر بالكامل خاضع لسياسات الأمان السيبراني الفيدرالية لنجوم دلتا' : 'Fully encrypted system protected under Delta Stars security standards'}
          </footer>
        </motion.div>

        {/* Biometric login loading animation overlay */}
        <AnimatePresence>
          {showBiometricAnimation && (
            <div className="fixed inset-0 bg-slate-950/90 z-50 flex flex-col justify-center items-center text-center p-6 backdrop-blur-md">
              <div className="relative w-32 h-32 flex items-center justify-center bg-green-950/20 rounded-full border border-green-500/20 mb-6 animate-pulse">
                <span className="text-6xl animate-bounce">🧬</span>
              </div>
              <h3 className="text-xl font-black text-white">{language === 'ar' ? 'جاري التحقق من بصمة الإصبع الحيوية...' : 'Scanning Biometric Signature...'}</h3>
              <p className="text-xs text-green-400 font-bold mt-2">{language === 'ar' ? 'يرجى وضع إصبعك على مستشعر البصمة بالجهاز' : 'Please place finger on the reader sensor'}</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Force Password Change Screen
  if (isForceChangePin) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-tajawal text-right" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-950 border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl space-y-6"
        >
          <header className="text-center space-y-2">
            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase px-3 py-1 rounded-xl">
              {language === 'ar' ? 'طلب تغيير كلمة المرور الإلزامية' : 'Mandatory PIN Update Requested'}
            </span>
            <h1 className="text-xl font-black text-white mt-2">
              {language === 'ar' ? 'تأمين كلمة المرور' : 'Secure your PIN'}
            </h1>
            <p className="text-gray-400 text-xs font-bold leading-normal">
              {language === 'ar' 
                ? 'لقد قمت بتسجيل الدخول بكلمة المرور الافتراضية الأولى (654321). لحماية حسابك وعمولاتك، يجب استبدالها بكلمة مرور جديدة فريدة.'
                : 'You logged in with the default first PIN (654321). You must configure a custom secure password now.'}
            </p>
          </header>

          <form onSubmit={handleForceChangePin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-amber-500 mb-2 uppercase">
                {language === 'ar' ? 'كلمة المرور الجديدة' : 'New Passcode / PIN'}
              </label>
              <input 
                type="password" 
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="••••••"
                maxLength={10}
                className="w-full px-5 py-4 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold text-sm text-center tracking-widest"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-amber-500 mb-2 uppercase">
                {language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New PIN'}
              </label>
              <input 
                type="password" 
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                placeholder="••••••"
                maxLength={10}
                className="w-full px-5 py-4 bg-slate-900 border border-white/10 rounded-2xl outline-none focus:border-amber-500 text-white font-bold text-sm text-center tracking-widest"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-2xl text-sm transition-all"
            >
              {language === 'ar' ? 'حفظ وتفعيل الحساب الآمن 🔑' : 'Save & Secure Account 🔑'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const isDriverRole = currentUser.role === 'driver' || currentUser.type === 'driver';

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-tajawal text-right" dir="rtl">
      {/* Top Navigation Jumbotron */}
      <div className="bg-slate-900 text-white pt-24 pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-800/10 to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center">
              <TruckIcon className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">
                  {isDriverRole ? (language === 'ar' ? 'البوابة الذكية للسائقين' : 'Smart Driver Interface') : (language === 'ar' ? 'البوابة الذكية للمناديب' : 'Delegate Strategic Dashboard')}
                </h1>
                <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-[10px] font-black uppercase">
                  {currentUser.type || currentUser.role}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1">
                {currentUser.name || currentUser.full_name} • {currentUser.email || currentUser.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick biometric status */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-white/5 text-xs text-gray-300 font-bold">
              <span>{language === 'ar' ? 'دخول البصمة الحيوية:' : 'Biometric Auth:'}</span>
              <button 
                onClick={toggleBiometricEnrollment}
                className={`w-10 h-6 rounded-full transition-all relative ${isBiometricEnrolled ? 'bg-green-500' : 'bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${isBiometricEnrolled ? 'right-5' : 'right-1'}`} />
              </button>
            </div>

            <button 
              onClick={handleLogout}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all"
            >
              {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-24 relative z-20 space-y-6">
        {/* Connection status card */}
        <div className={`p-8 rounded-[3rem] shadow-xl transition-all border ${isOnline ? 'bg-green-700 text-white border-green-800 shadow-green-700/10' : 'bg-white text-slate-800 border-gray-100'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-black mb-1">
                {isOnline 
                  ? (language === 'ar' ? 'حالة التواجد الميداني: نشط ومتصل 📡' : 'Field Status: Online & Tracking 📡')
                  : (language === 'ar' ? 'حالة التواجد الميداني: غير متصل' : 'Field Status: Offline')}
              </h2>
              <p className="text-sm font-bold opacity-85 leading-normal">
                {isOnline 
                  ? (language === 'ar' ? 'المنظومة تتبع وتوجه مساراتك وتلقائياً تسند إليك صفقات وفواتير العملاء ضمن نطاق فروعك.' : 'Your live coordinates are broadcasting. Inbound supply requests are routed here.')
                  : (language === 'ar' ? 'يرجى تنشيط المفتاح لبدء استقبال التوريدات والطلبات وتتبع الخرائط.' : 'Activate your transmitter to start receiving orders and tracking maps.')}
              </p>
            </div>
            <button 
              onClick={() => {
                setIsOnline(!isOnline);
                addToast(
                  language === 'ar' 
                    ? (isOnline ? 'أنت الآن خارج نطاق الاتصال' : 'أنت متصل بالوقت الفعلي وتحت تتبع الإدارة العامة')
                    : (isOnline ? 'Field agent offline' : 'Active and GPS broadcast online'),
                  'info'
                );
              }}
              className={`px-8 py-4 rounded-2xl font-black text-md transition-all shadow-xl ${isOnline ? 'bg-white text-green-700 hover:bg-gray-100' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              {isOnline ? (language === 'ar' ? 'إيقاف البث' : 'Go Offline') : (language === 'ar' ? 'تفعيل الاتصال وبث GPS 🚀' : 'Go Online & GPS 🚀')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <span className="text-2xl">📦</span>
            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-wider">{language === 'ar' ? 'الطلبات المنجزة' : 'COMPLETED TASKS'}</p>
            <p className="text-2xl font-black text-slate-800">{totalCompleted}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <span className="text-2xl">💰</span>
            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-wider">{language === 'ar' ? 'العمولات المستحقة' : 'COMMISSIONS EARNED'}</p>
            <p className="text-2xl font-black text-green-600">{formatCurrency(earnedCommission)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <span className="text-2xl">💵</span>
            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-wider">{language === 'ar' ? 'المبالغ المحصلة' : 'CASH COLLECTED'}</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(totalCollectedCash)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
            <span className="text-2xl">⭐</span>
            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-wider">{language === 'ar' ? 'التقييم الحالي' : 'AGENT RATING'}</p>
            <p className="text-2xl font-black text-amber-500">4.9 ★</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-200/50 p-2 rounded-3xl max-w-lg">
          <button 
            onClick={() => setActiveTab('dispatches')}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all ${activeTab === 'dispatches' ? 'bg-green-700 text-white shadow-md' : 'text-slate-600 hover:bg-gray-200'}`}
          >
            {language === 'ar' ? '📋 المهام والتوصيل' : '📋 Dispatches'}
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all ${activeTab === 'map' ? 'bg-green-700 text-white shadow-md' : 'text-slate-600 hover:bg-gray-200'}`}
          >
            {language === 'ar' ? '🗺️ خريطة المسار' : '🗺️ Routes Map'}
          </button>
          <button 
            onClick={() => setActiveTab('finance')}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all ${activeTab === 'finance' ? 'bg-green-700 text-white shadow-md' : 'text-slate-600 hover:bg-gray-200'}`}
          >
            {language === 'ar' ? '📊 التقارير المالية' : '📊 Ledger & Cash'}
          </button>
          {!isDriverRole && (
            <button 
              onClick={() => setActiveTab('contracts')}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all ${activeTab === 'contracts' ? 'bg-green-700 text-white shadow-md' : 'text-slate-600 hover:bg-gray-200'}`}
            >
              {language === 'ar' ? '💼 بوابة الشركات' : '💼 B2B Portal'}
            </button>
          )}
        </div>

        {/* Tab contents */}
        <div className="space-y-6">
          {activeTab === 'dispatches' && (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span>📦</span>
                {language === 'ar' ? 'قائمة المهام النشطة للشحن والتفريغ' : 'Active Duty Dispatch Pool'}
              </h3>

              {activeOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 space-y-2">
                  <p className="text-gray-400 font-bold">{language === 'ar' ? 'لا توجد طلبات نشطة في حوزتك حالياً' : 'No active dispatches found for your account'}</p>
                  <p className="text-gray-400 text-xs">{language === 'ar' ? 'عند تعيين الإدارة العامة لطلب جديد، ستتلقى نغمة رنين وتوجيهات صوتية فورية' : 'New assignments trigger immediate visual and speech alerts.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeOrders.map(order => (
                    <div key={order.id} className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 space-y-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                      {/* Branch badge */}
                      <span className="absolute top-4 left-4 bg-slate-200 text-slate-800 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                        {language === 'ar' ? 'الفرع الرياض' : 'Riyadh Node'}
                      </span>

                      <div>
                        <h4 className="text-lg font-black text-slate-800">#{order.id.slice(-8)}</h4>
                        <p className="text-xs text-gray-400 font-bold">{order.createdAt?.split('T')[0]}</p>
                      </div>

                      <div className="border-t border-b border-gray-200/50 py-3 space-y-2 text-sm text-slate-700 font-bold">
                        <p className="flex items-center gap-2">
                          <span className="text-gray-400">👤</span>
                          {order.customerName || 'مستفيد مجهول'}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-gray-400">📞</span>
                          {order.customerPhone || '---'}
                        </p>
                        <p className="flex items-center gap-2 leading-relaxed">
                          <span className="text-red-500">📍</span>
                          {order.address || 'حي الصحافة، الرياض'}
                        </p>
                        <p className="flex items-center gap-2 text-green-700">
                          <span className="text-gray-400">💰</span>
                          {language === 'ar' ? 'المبلغ المطلوب تحصيله:' : 'Collect Amount:'} {formatCurrency(order.total)}
                        </p>
                      </div>

                      {/* Customer Actions */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (order.customerPhone) window.open(`tel:${order.customerPhone}`);
                          }}
                          className="flex-1 bg-white border border-gray-200 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-slate-700"
                        >
                          <PhoneIcon className="w-4 h-4 text-slate-500" />
                          {language === 'ar' ? 'اتصال بالمستفيد' : 'Call Customer'}
                        </button>
                        <button 
                          onClick={() => {
                            const queryStr = encodeURIComponent(order.address || 'Saudi Arabia');
                            window.open(`https://www.google.com/maps/search/?api=1&query=${queryStr}`);
                          }}
                          className="flex-1 bg-white border border-gray-200 p-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-all text-slate-700"
                        >
                          <NavigationIcon className="w-4 h-4 text-blue-500" />
                          {language === 'ar' ? 'الاتجاه والمسار' : 'Navigation Map'}
                        </button>
                      </div>

                      {/* Timeline status workflow buttons */}
                      <div className="pt-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{language === 'ar' ? 'مراحل التوريد الجاري' : 'LOCKED LOGISTICS STAGES'}</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { state: 'preparing', label: language === 'ar' ? 'تجهيز بمستودع 🏢' : 'Warehouse Prep' },
                            { state: 'setup', label: language === 'ar' ? 'تحميل الشاحنة 🚚' : 'Truck Setup' },
                            { state: 'shipped', label: language === 'ar' ? 'خرج للتوصيل 📍' : 'Out for Delivery' },
                            { state: 'delivered', label: language === 'ar' ? 'تسليم وإثبات ✍️' : 'Proof & Feedback' }
                          ].map((stage) => {
                            const isCurrent = order.status === stage.state;
                            return (
                              <button
                                key={stage.state}
                                onClick={() => {
                                  if (stage.state === 'delivered') {
                                    setActiveDeliveryOrder(order);
                                    setCustomerFeedback('');
                                  } else {
                                    handleUpdateStatus(order.id, stage.state);
                                  }
                                }}
                                disabled={order.status === stage.state}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${isCurrent ? 'bg-green-700 text-white shadow-md' : 'bg-white text-slate-500 border border-gray-200 hover:border-green-600 hover:text-green-600'}`}
                              >
                                {stage.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'map' && (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-4">
              <h3 className="text-xl font-black text-slate-800">{language === 'ar' ? 'خريطة تتبع المسارات والفروع النشطة' : 'Active Routing Coordinates'}</h3>
              <p className="text-xs text-gray-400 font-bold">{language === 'ar' ? 'الخريطة المباشرة تحدد موقعك وأقرب المستودعات لفرعك لضمان جودة توصيل السلع المبردة.' : 'Real-time routing matching the nearest supply nodes.'}</p>
              <BranchMap lang={language} />
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-6">
              <h3 className="text-xl font-black text-slate-800">{language === 'ar' ? 'السجل والتقرير المالي والعهدة' : 'Field Earnings Ledger & Auditing'}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver statistics card */}
                <div className="bg-slate-900 text-white p-8 rounded-[2rem] space-y-4">
                  <h4 className="text-lg font-black text-green-400">{language === 'ar' ? 'ملخص الأداء المحاسبي اليوم' : 'Accounting metrics'}</h4>
                  <div className="space-y-3 font-bold text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">{language === 'ar' ? 'إجمالي الطلبات المكتملة:' : 'Delivered Tasks:'}</span>
                      <span>{totalCompleted} {language === 'ar' ? 'طلبات' : 'orders'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">{language === 'ar' ? 'معدل العمولة للتوصيل اليوم:' : 'Commision calculation:'}</span>
                      <span>{isDriverRole ? '15 ريال لكل طلب' : '5% من إجمالي المبيعات'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-gray-400">{language === 'ar' ? 'إجمالي عمولاتك المكتسبة:' : 'Commissions accumulated:'}</span>
                      <span className="text-green-400">{formatCurrency(earnedCommission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">{language === 'ar' ? 'العهدة النقدية المحصلة (Cash):' : 'Collected Cash in Hand:'}</span>
                      <span className="text-amber-400">{formatCurrency(totalCollectedCash)}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-xs text-gray-400 leading-relaxed font-semibold">
                    {language === 'ar' 
                      ? '⚠️ يرجى تسوية المبالغ النقدية المحصلة مع أمين الصندوق في أقرب فرع بنهاية الوردية لتجنب تجميد المحفظة.'
                      : 'Collected COD must be handed over to branch accountant at end of shift.'}
                  </div>
                </div>

                {/* History of duty dispatches */}
                <div className="space-y-4">
                  <h4 className="text-lg font-black text-slate-800">{language === 'ar' ? 'المهام المؤرشفة بنجاح اليوم' : 'Archived Deliveries'}</h4>
                  {localOrders.filter(o => o.status === 'delivered').length === 0 ? (
                    <p className="text-gray-400 font-bold text-xs">{language === 'ar' ? 'لا توجد عمليات مسلمة في السجل اليوم بعد.' : 'No items archived today.'}</p>
                  ) : (
                    <div className="space-y-3">
                      {localOrders.filter(o => o.status === 'delivered').map(order => (
                        <div key={order.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center text-sm font-bold">
                          <div>
                            <p className="text-slate-800">#{order.id.slice(-8)}</p>
                            <p className="text-xs text-gray-400">{order.customerName}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-green-700">{formatCurrency(order.total)}</p>
                            <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{language === 'ar' ? 'مكتمل ومؤرشف' : 'Delivered'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && !isDriverRole && (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 space-y-6 animate-fade-in">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span>💼</span>
                {language === 'ar' ? 'بوابة الشركات وإدارة حسابات VIP المعزولة' : 'B2B Enterprise Corporate Console'}
              </h3>
              <p className="text-xs text-gray-400 font-bold">
                {language === 'ar' ? 'هذا القسم يتيح للمناديب تتبع العقود الحصرية الموثقة وإحصائيات كبار العملاء وتوزيع الشحنات بنسب مخصصة.' : 'Exclusive accounts segregation and bespoke supply contract management.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-bold text-sm">
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 text-center space-y-1">
                  <p className="text-gray-400 text-xs">{language === 'ar' ? 'العقود النشطة بالمنطقة' : 'Active Contracts'}</p>
                  <p className="text-2xl text-slate-800">12</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 text-center space-y-1">
                  <p className="text-gray-400 text-xs">{language === 'ar' ? 'حسابات VIP المعزولة' : 'B2B Client Segments'}</p>
                  <p className="text-2xl text-slate-800">4</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-gray-100 text-center space-y-1">
                  <p className="text-gray-400 text-xs">{language === 'ar' ? 'نسب التوريد المؤتمتة' : 'Automated Commission Rate'}</p>
                  <p className="text-2xl text-green-600">5 %</p>
                </div>
              </div>

              {/* Corporate Clients list */}
              <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 p-4 font-black text-slate-800 text-xs uppercase tracking-widest">{language === 'ar' ? 'بيانات كبار العملاء النشطة للمندوب' : 'B2B Enterprise Portfolio'}</div>
                <div className="divide-y divide-gray-100 font-bold text-sm">
                  {[
                    { company: 'مؤسسة الرياض للفواكه', representative: 'أ. فهد الرويلي', status: 'نشط', limit: '50,000 ريال' },
                    { company: 'سوبرماركت النخبة الغذائية', representative: 'م. خالد الصالح', status: 'نشط', limit: '120,000 ريال' },
                    { company: 'فنادق الهيلتون الرياض', representative: 'د. يوسف الحربي', status: 'معلق', limit: '200,000 ريال' }
                  ].map((corp, index) => (
                    <div key={index} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50/50 transition-all">
                      <div>
                        <p className="text-slate-800">{corp.company}</p>
                        <p className="text-xs text-gray-400">{corp.representative}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-slate-700 text-xs">{language === 'ar' ? 'حد الائتمان:' : 'Credit limit:'} {corp.limit}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] mt-1 ${corp.status === 'نشط' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{corp.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Electronic Proof of Delivery & Locked Review Modal */}
      {activeDeliveryOrder && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-tajawal text-right" dir="rtl">
          <div className="bg-white rounded-[3rem] p-8 md:p-10 max-w-xl w-full border-4 border-green-700 shadow-2xl text-slate-800 relative">
            <button 
              onClick={() => {
                setActiveDeliveryOrder(null);
                setSignatureImg(null);
              }}
              className="absolute top-6 left-6 text-gray-400 hover:text-red-600 font-black p-2 rounded-full hover:bg-slate-50 transition-all text-lg"
            >
              ✕
            </button>

            <header className="border-b border-gray-100 pb-4 mb-6">
              <span className="bg-green-100 text-green-800 text-[10px] font-black uppercase px-3 py-1 rounded-xl">
                {language === 'ar' ? 'إثبات التسليم والملاحظات المحمية (POD)' : 'Electronic Proof Of Delivery & Locked Feedback'}
              </span>
              <h3 className="text-2xl font-black mt-2 text-green-900">
                {language === 'ar' ? 'تقرير التوقيع والشكاوى المباشر للعميل' : 'Customer Electronic Verification'}
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">
                {language === 'ar' ? 'طلب رقم' : 'Order ID'}: #{activeDeliveryOrder.id.slice(-8)} • {activeDeliveryOrder.customerName}
              </p>
            </header>

            <div className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <p className="text-xs font-black text-slate-500">{language === 'ar' ? 'مبلغ التحصيل عند الاستلام' : 'Cash on Delivery Collection'}</p>
                <p className="text-xl font-black text-green-700">{formatCurrency(activeDeliveryOrder.total)}</p>
              </div>

              {/* Secure feedback field from user */}
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-2">
                  {language === 'ar' ? 'ملاحظات أو اقتراحات أو شكاوى المستفيد (محمية ومغلقة آلياً للأمن العام والمطور)' : 'Direct Customer Complaints / Notes (Read-only for Agent, Syncs to Admin)'}
                </label>
                <textarea 
                  rows={2}
                  value={customerFeedback}
                  onChange={(e) => setCustomerFeedback(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب أي شكوى أو ملاحظة للمستفيد هنا (يمنع المندوب من تعديلها أو حذفها لاحقاً)...' : 'Customer feedback / grievances (cannot be altered by the dispatch driver)...'}
                  className="w-full p-4 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-green-600"
                />
                <p className="text-[10px] text-amber-600 font-black mt-1">
                  {language === 'ar' ? '⚠️ بمجرد التأكيد، تحفظ الملاحظات والشكاوى آلياً إلى لوحة المطور وقسم الإدارة العامة مباشرة كأرشيف دائم غير قابل للتعديل.' : '⚠️ Once confirmed, feedback is locked and broadcasted directly to the Sovereign Developer Dashboard.'}
                </p>
              </div>

              {/* Signature Pad */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black text-gray-500 uppercase">{language === 'ar' ? 'ارسم توقيع المستلم الموثق هنا' : 'Draw Customer Signature Here'}</label>
                  <button 
                    onClick={clearCanvas}
                    className="text-[10px] text-red-500 font-black hover:underline"
                  >
                    {language === 'ar' ? 'مسح اللوحة وإعادة رسم التوقيع 🔄' : 'Clear Pad 🔄'}
                  </button>
                </div>
                <div className="bg-gray-100 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden relative">
                  <canvas 
                    ref={canvasRef}
                    width={500}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="cursor-crosshair w-full h-32 block bg-gray-50"
                  />
                  {!signatureImg && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs pointer-events-none font-bold">
                      {language === 'ar' ? 'يرجى توقيع المستلم هنا بإصبعه على الشاشة' : 'Draw signature with finger or pointing device'}
                    </div>
                  )}
                </div>
              </div>

              {/* Legal Warning Notice */}
              <div className="flex items-start gap-3 bg-green-50 p-4 rounded-2xl border border-green-100">
                <div className="p-1 bg-green-200 text-green-800 rounded-full mt-0.5">
                  <ShieldCheckIcon className="w-4 h-4" />
                </div>
                <p className="text-xs text-green-950 font-bold leading-normal">
                  {language === 'ar' 
                    ? 'بتوثيق الاستلام، يتم قفل الفاتورة إلكترونياً وتحديث المستندات المالية بنظام مبيعات مجموعة دلتا نجوم.'
                    : 'Confirming logs this invoice under electronic regulatory standards.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    setActiveDeliveryOrder(null);
                    setSignatureImg(null);
                  }}
                  className="py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-xl text-sm transition-all"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={handleCompleteDelivery}
                  className="py-4 bg-green-700 hover:bg-green-600 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-green-700/20"
                >
                  {language === 'ar' ? 'تأكيد وإقفال الطلب 🔒' : 'Verify & Lock Order 🔒'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
