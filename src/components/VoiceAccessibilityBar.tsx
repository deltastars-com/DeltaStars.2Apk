import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceAccessibilityBarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  language: string;
  cartCount?: number;
  onOpenAiAssistant?: () => void;
}

export const VoiceAccessibilityBar: React.FC<VoiceAccessibilityBarProps> = ({
  currentPage,
  onNavigate,
  language,
  cartCount = 0,
  onOpenAiAssistant
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [autoDetectedVisuallyImpaired, setAutoDetectedVisuallyImpaired] = useState(false);
  const [voiceAccessibilityMode, setVoiceAccessibilityMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ds_voice_accessibility_mode') === 'true';
    } catch {
      return false;
    }
  });

  const recognitionRef = useRef<any>(null);
  const isAr = language === 'ar';

  // Text To Speech Function
  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isAr ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEndCallback) onEndCallback();
    };
    utterance.onerror = () => setIsSpeaking(false);

    // Try to pick an Arabic or English voice if available
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => 
      isAr ? v.lang.startsWith('ar') : v.lang.startsWith('en')
    );
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [isAr]);

  // Automated Greeting for Visually Impaired Users
  const announceAccessibilityGreeting = useCallback(() => {
    const greetingText = isAr
      ? 'أهلاً بك في متجر نجوم دلتا للتجارة. لقد تحقق النظام آلياً من تفضيلات إمكانية الوصول وقارئ الشاشة لضعاف البصر. أنا عدي، مساعدك الذكي. يسعدني تقديم المساعدة الفورية لك بصوت واضح. يتوفر لدينا تفاح إيطالي بسعر 8.50 ريال، طماطم بلدي بسعر 4.50 ريال، وتمر خلاص فاخر بسعر 25 ريال. الشحن مجاني للطلبات فوق 200 ريال. يمكنك الضغط على Alt + V أو التحدث معي مباشرة للتسوق.'
      : 'Welcome to Delta Stars Trading. The system has automatically detected accessibility and screen reader preferences. I am Oday, your smart assistant. Fresh Italian Apples at 8.50 SAR, Local Tomatoes at 4.50 SAR, and Premium Dates at 25 SAR. Free delivery for orders over 200 SAR. Press Alt + V anytime to speak.';

    speakText(greetingText);
    setIsExpanded(true);
  }, [isAr, speakText]);

  // Automatic Browser Accessibility Check on Mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const isHighContrast = window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches;
      const isForcedColors = window.matchMedia && window.matchMedia('(forced-colors: active)').matches;
      const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const savedMode = localStorage.getItem('ds_voice_accessibility_mode') === 'true';

      if (isHighContrast || isForcedColors || isReducedMotion || savedMode) {
        setAutoDetectedVisuallyImpaired(true);
        setVoiceAccessibilityMode(true);
        
        // Trigger automated vocal interaction after brief delay
        const timer = setTimeout(() => {
          announceAccessibilityGreeting();
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      // Fallback
    }
  }, [announceAccessibilityGreeting]);

  // Toggle Accessibility Mode
  const toggleAccessibilityMode = () => {
    const nextVal = !voiceAccessibilityMode;
    setVoiceAccessibilityMode(nextVal);
    try {
      localStorage.setItem('ds_voice_accessibility_mode', String(nextVal));
    } catch {}

    const text = nextVal
      ? isAr
        ? 'تم تفعيل وضع التصفح الصوتي الشامل لفاقدي البصر. يمكنك الآن التحدث بالأوامر واستماع المحتوى.'
        : 'Voice accessibility mode activated for visually impaired users. You can now speak commands and hear page content.'
      : isAr
        ? 'تم إيقاف وضع التصفح الصوتي'
        : 'Voice accessibility mode deactivated.';

    speakText(text);
  };

  // Speak Featured Products & Prices
  const speakProductsAndPrices = () => {
    const productListText = isAr
      ? 'إليك أبرز المنتجات والأسعار المعتمدة اليوم في متجر نجوم دلتا:\n' +
        '1. تفاح أحمر فاخر: 8.50 ريال للكيلو.\n' +
        '2. موز طازج: 5.25 ريال للكيلو.\n' +
        '3. طماطم بلدي طازجة: 4.50 ريال للكيلو.\n' +
        '4. خيار بلدي: 4.00 ريال للكيلو.\n' +
        '5. تمر خلاص القصيم المعتمد: 25.00 ريال للكرتون 1 كيلو.\n' +
        '6. السلة العائلية المشكلة: 99.00 ريال.\n' +
        'علماً أن التوصيل مجاني لجميع الطلبات من 200 ريال فأكثر.'
      : 'Featured products and prices today:\n' +
        '1. Fresh Red Apples: 8.50 SAR per kg.\n' +
        '2. Fresh Bananas: 5.25 SAR per kg.\n' +
        '3. Local Tomatoes: 4.50 SAR per kg.\n' +
        '4. Local Cucumbers: 4.00 SAR per kg.\n' +
        '5. Premium Qassim Dates: 25.00 SAR per box.\n' +
        '6. Family Mix Basket: 99.00 SAR.\n' +
        'Free shipping on orders 200 SAR or more.';

    speakText(productListText);
  };

  // Read current page aloud
  const readCurrentPageAloud = useCallback(() => {
    let summaryText = '';
    switch (currentPage) {
      case 'home':
        summaryText = isAr
          ? 'أنت الآن في الصفحة الرئيسية لمتجر نجوم دلتا. يتوفر قسم العروض الموسمية، الفواكه الطازجة، والتمور والمنتجات المغلفة. استخدم البحث الصوتي لأي منتج.'
          : 'You are on the Home Page of Delta Stars. Seasonal offers, fresh fruits, dates, and packages are available. Use voice search for any item.';
        break;
      case 'showroom':
        summaryText = isAr
          ? 'أنت في صالة العروض والتصفح السريع. يمكنك تصفح المنتجات بأسعارها الحقيقية والصفقات اليومية.'
          : 'You are in the Showroom. Browse real products, daily deals, and discounts.';
        break;
      case 'products':
        summaryText = isAr
          ? 'قسم جميع المنتجات. تحتوي القائمة على الفواكه والخضروات والتمور والورود والمغلفات.'
          : 'All Products catalog. Fruits, vegetables, dates, flowers, and packages.';
        break;
      case 'cart':
        summaryText = isAr
          ? `سلة المشتريات تحتوي حالياً على ${cartCount} عناصر. اضغط لإكمال الطلب والدفع الإلكتروني الآمن.`
          : `Shopping Cart currently has ${cartCount} items. Proceed to checkout for secure payment.`;
        break;
      case 'track':
        summaryText = isAr
          ? 'صفحة تتبع الطلبات المباشرة عبر نظام التتبع الجغرافي للمناديب.'
          : 'Live Order Tracking page with GPS delegate monitoring.';
        break;
      case 'contact':
        summaryText = isAr
          ? 'صفحة التواصل والدعم الفني. هاتف الخدمة وتطبيق الواتساب والموقع المباشر للفروع.'
          : 'Contact and Customer Support page. Service phone, WhatsApp, and branch locations.';
        break;
      default:
        summaryText = isAr
          ? `أنت في قسم ${currentPage}. استخدم البحث الصوتي للانتقال السريع.`
          : `You are in section ${currentPage}. Use voice search for quick navigation.`;
        break;
    }
    speakText(summaryText);
  }, [currentPage, isAr, cartCount, speakText]);

  // Automatically read page summary if Voice Accessibility Mode is active
  useEffect(() => {
    if (voiceAccessibilityMode && !autoDetectedVisuallyImpaired) {
      const timer = setTimeout(() => {
        readCurrentPageAloud();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currentPage, voiceAccessibilityMode, autoDetectedVisuallyImpaired, readCurrentPageAloud]);

  // Voice Command Processor
  const processVoiceCommand = useCallback((cmd: string) => {
    const lower = cmd.trim().toLowerCase();

    // Navigation commands
    if (lower.includes('رئيسية') || lower.includes('الرئيسية') || lower.includes('home')) {
      onNavigate('home');
      speakText(isAr ? 'تم الانتقال إلى الصفحة الرئيسية' : 'Navigated to Home Page');
      return;
    }
    if (lower.includes('معرض') || lower.includes('المعرض') || lower.includes('عروض') || lower.includes('showroom')) {
      onNavigate('showroom');
      speakText(isAr ? 'تم الانتقال إلى صالة العروض' : 'Navigated to Showroom');
      return;
    }
    if (lower.includes('منتجات') || lower.includes('المنتجات') || lower.includes('أسعار') || lower.includes('products')) {
      onNavigate('products');
      speakProductsAndPrices();
      return;
    }
    if (lower.includes('سلة') || lower.includes('السلة') || lower.includes('cart')) {
      onNavigate('cart');
      speakText(isAr ? `تم الانتقال إلى سلة المشتريات. عدد العناصر ${cartCount}` : `Navigated to Cart. ${cartCount} items.`);
      return;
    }
    if (lower.includes('تتبع') || lower.includes('طلبي') || lower.includes('track')) {
      onNavigate('track');
      speakText(isAr ? 'تم الانتقال إلى صفحة تتبع الطلبات' : 'Navigated to Order Tracking');
      return;
    }
    if (lower.includes('تواصل') || lower.includes('اتصال') || lower.includes('contact')) {
      onNavigate('contact');
      speakText(isAr ? 'تم الانتقال إلى صفحة التواصل والدعم' : 'Navigated to Contact');
      return;
    }
    if (lower.includes('اقرأ') || lower.includes('قراءة') || lower.includes('محتوى') || lower.includes('read')) {
      readCurrentPageAloud();
      return;
    }
    if (lower.includes('عدي') || lower.includes('مساعد') || lower.includes('ذكاء')) {
      if (onOpenAiAssistant) {
        onOpenAiAssistant();
        speakText(isAr ? 'تم فتح المساعد الذكي عدي للتحدث والتسوق الصوتي المباشر' : 'AI Assistant Oday is now open for direct voice conversation');
      }
      return;
    }
    if (lower.includes('توقف') || lower.includes('اسكت') || lower.includes('إيقاف') || lower.includes('stop')) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    // Default search action
    onNavigate('showroom', { search: cmd });
    speakText(isAr ? `جاري البحث عن "${cmd}" في جميع الأقسام` : `Searching for "${cmd}" across all sections`);
  }, [isAr, cartCount, onNavigate, speakText, readCurrentPageAloud, onOpenAiAssistant]);

  // Start Voice Recognition
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      speakText(isAr ? 'عذراً، متصفحك لا يدعم التعرف الصوتي المباشر' : 'Voice recognition is not supported in this browser');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = isAr ? 'ar-SA' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      speakText(isAr ? 'جاري الاستماع الآن، تحدث بالأمر أو اسم المنتج' : 'Listening now, speak command or product name');

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setTranscript(text);
          processVoiceCommand(text);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        speakText(isAr ? 'لم أتمكن من التقاط الصوت، أعد المحاولة' : 'Could not hear clearly, please try again');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Keyboard shortcut listener: Alt + V to trigger voice search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'v' || e.key === 'V' || e.key === 'ر')) {
        e.preventDefault();
        startListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed top-28 sm:top-36 md:top-28 right-2 sm:right-4 md:right-6 z-[95] font-sans pointer-events-auto scale-75 sm:scale-85 md:scale-100 origin-top-right">
      {/* Floating Accessibility Trigger Button */}
      <div className="flex items-center gap-1 sm:gap-2">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isAr ? 'الملاحة والبحث الصوتي الشامل لضعاف البصر' : 'Voice Accessibility Search Bar'}
          className={`px-2 py-1 sm:px-3.5 sm:py-2.5 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.35)] border-2 flex items-center gap-1 sm:gap-2 transition-all backdrop-blur-xl ${
            voiceAccessibilityMode
              ? 'bg-amber-500 text-black border-amber-300 ring-2 ring-amber-400/40 font-black'
              : 'bg-primary/95 text-yellow-400 border-secondary/60 hover:border-yellow-300 hover:bg-primary'
          }`}
          title="Alt + V للبحث الصوتي المباشر"
        >
          <span className="text-xs sm:text-base animate-bounce">🎙️</span>
          <span className="text-[9px] sm:text-xs font-black hidden sm:inline">
            {isAr ? 'التصفح الصوتي لضعاف البصر' : 'Voice & Accessibility'}
          </span>
          {voiceAccessibilityMode && (
            <span className="bg-black text-amber-400 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full border border-amber-400">
              {isAr ? 'مُفعّل' : 'Active'}
            </span>
          )}
        </motion.button>

        {/* Quick Mic Action Chip */}
        <button
          onClick={startListening}
          className={`w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center p-0 rounded-full shadow-lg border-2 transition-all ${
            isListening
              ? 'bg-red-600 text-white border-white animate-ping'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
          }`}
          title={isAr ? 'اضغط للتحدث الآن (Alt + V)' : 'Click to Speak (Alt + V)'}
        >
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V4.5a3 3 0 00-6 0v8.25a3 3 0 003 3z" />
          </svg>
        </button>
      </div>

      {/* Expanded Accessibility & Voice Panel (Opens Downwards gracefully) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-full mt-2 right-0 w-[calc(100vw-2rem)] sm:w-96 max-h-[75vh] overflow-y-auto bg-primary/95 text-white border-2 border-secondary/60 backdrop-blur-2xl rounded-3xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-4 z-[120]"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👁️‍🗨️</span>
                <div>
                  <h3 className="text-sm font-black text-secondary">
                    {isAr ? 'نظام المساعدة والتوجيه التلقائي لضعاف البصر' : 'Automated Accessibility Assistant'}
                  </h3>
                  <p className="text-[10px] text-emerald-300 font-bold">
                    {autoDetectedVisuallyImpaired
                      ? (isAr ? 'تم التحقق من المتصفح آلياً وتفعيل المساعد' : 'Auto-detected accessibility settings')
                      : (isAr ? 'جاهز لخدمتك بالأوامر والصوت المباشر' : 'Ready for voice interaction')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={startListening}
                className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border transition-all ${
                  isListening
                    ? 'bg-red-600 text-white border-red-400 animate-pulse'
                    : 'bg-secondary text-primary border-yellow-300 hover:bg-amber-400'
                }`}
              >
                <span>🎙️</span>
                <span>{isListening ? (isAr ? 'جاري الاستماع... تحدث الآن' : 'Listening... Speak now') : (isAr ? 'التحدث بالأمر الصوتي المباشر (Alt + V)' : 'Start Voice Search (Alt + V)')}</span>
              </button>

              <button
                onClick={speakProductsAndPrices}
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>🍎</span>
                <span>{isAr ? 'استماع لأهم المنتجات والأسعار المعتمدة' : 'Listen to Products & Prices'}</span>
              </button>

              {onOpenAiAssistant && (
                <button
                  onClick={() => {
                    onOpenAiAssistant();
                    speakText(isAr ? 'تم فتح المساعد عدي للتحدث والتسوق الصوتي المباشر' : 'AI Assistant Oday opened');
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400 text-xs font-black flex items-center justify-center gap-2 hover:bg-amber-500/30 transition-all"
                >
                  <span>🌟</span>
                  <span>{isAr ? 'فتح المساعد عدي للمشورة والمساعدة الفعلية' : 'Open Oday AI Assistant'}</span>
                </button>
              )}

              <button
                onClick={toggleAccessibilityMode}
                className={`w-full py-2 px-4 rounded-2xl font-black text-xs flex items-center justify-between border transition-all ${
                  voiceAccessibilityMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>🔊</span>
                  <span>{isAr ? 'وضع القراءة والإجهار الصوتي' : 'Screen Reader Voice Mode'}</span>
                </div>
                <span className={`px-2 py-0.5 text-[9px] rounded-full font-black ${voiceAccessibilityMode ? 'bg-amber-400 text-black' : 'bg-gray-700 text-white'}`}>
                  {voiceAccessibilityMode ? (isAr ? 'مُفعّل' : 'ON') : (isAr ? 'معطل' : 'OFF')}
                </span>
              </button>

              <button
                onClick={readCurrentPageAloud}
                className="w-full py-2 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/90 border border-white/10 text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>🗣️</span>
                <span>{isAr ? 'اقرأ محتوى القسم الحالي بصوت واضح' : 'Read current section aloud'}</span>
              </button>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="bg-black/40 p-3 rounded-2xl border border-secondary/30 text-xs">
                <span className="text-[10px] text-secondary font-black block mb-1">
                  {isAr ? 'الصوت الملتقط:' : 'Captured Voice:'}
                </span>
                <p className="font-bold text-white">"{transcript}"</p>
              </div>
            )}

            {/* Voice Command Hints */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-[10px] space-y-1 text-white/70">
              <span className="font-black text-secondary block">
                {isAr ? 'أوامر صوتية سريعة:' : 'Quick Voice Commands:'}
              </span>
              <p>• "أسعار المنتجات" | "اقرأ الصفحة" | "السلة"</p>
              <p>• "عدي" | "ابحث عن [تمر خلاص / تفاح]"</p>
              <p>• "تتبع طلبي" | "تواصل" | "توقف"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

