import React, {
  useState, useEffect, useRef, useCallback, memo,
} from 'react';
import { chatWithOday } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
// Inline SVG icons — no external dependency
const XMarkIcon = ({ className='' }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
const PaperAirplaneIcon = ({ className='' }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" /></svg>;
const UserCircleIcon = ({ className='' }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" /></svg>;
const CpuChipIcon = ({ className='' }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" /></svg>;
const SparklesIcon = ({ className='' }) => <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036a2.63 2.63 0 0 0 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a2.63 2.63 0 0 0-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.63 2.63 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.63 2.63 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" /></svg>;
const SpeakerIcon = ({ className='' }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.287a5.25 5.25 0 0 1 0 7.426M12 6V18l-5-4H3V10h4l5-4Z" /></svg>;
const ArrowRightIcon = ({ className='' }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>;
const HomeIcon = ({ className='' }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;

// Dynamic Audio Waveform Animation Component
const AudioWaveform: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string; barsCount?: number }> = ({
  size = 'md',
  color = 'bg-amber-400',
  barsCount = 7
}) => {
  const bars = Array.from({ length: barsCount });
  const maxHeight = size === 'sm' ? '14px' : size === 'lg' ? '32px' : '22px';

  return (
    <div className="flex items-center gap-1 h-6 px-1.5 py-1 bg-black/20 rounded-full backdrop-blur-sm border border-white/10">
      {bars.map((_, i) => (
        <motion.span
          key={i}
          animate={{
            scaleY: [0.15, 1, 0.35, 0.85, 0.2],
            opacity: [0.5, 1, 0.7, 1, 0.5]
          }}
          transition={{
            duration: 0.45 + (i * 0.07),
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: (i % 3) * 0.1
          }}
          className={`w-1 rounded-full ${color} origin-center shadow-sm`}
          style={{ height: '100%', maxHeight }}
        />
      ))}
    </div>
  );
};
import { useAuth } from '../contexts/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useFirebase } from './lib/contexts';
import { mockProducts } from './lib/vip/products';
import { REAL_PRODUCTS } from '../data/products';
import { useApp } from '../contexts/AppContext';
import { COMPANY_INFO, SYSTEM_CONFIG, sanitizeEmailForDisplay } from '../constants';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  actions?: QuickAction[];
}
interface QuickAction { label: string; value: string; }
interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt?: string;
  onFetchOrder?: (orderId: string) => Promise<any>;
  initialMessage?: string;
  onNavigate?: (page: string) => void;
}

const FAQ: Record<string, string> = {
  'مرحباً': 'مرحباً بك في متجر نجوم دلتا! 🎉 أنا عدي، مساعدك الذكي. كيف يمكنني مساعدتك؟',
  'السلام عليكم': 'وعليكم السلام ورحمة الله! أهلاً بك 🌟',
  'مساعدة': 'يمكنني مساعدتك في:\n• المنتجات والأسعار\n• تتبع الطلبات\n• طرق الدفع والشحن\n• العروض والخصومات\n• معلومات حسابك',
  'شكراً': 'العفو! شكراً لثقتك بنجوم دلتا 😊',
  'مع السلامة': 'مع السلامة! نتمنى لك يوماً سعيداً 🌟',
  'دفع': `نقبل: مدى، Visa، Mastercard، Apple Pay، STC Pay، تمارا، تابي\nجميع العمليات مشفرة وآمنة 🔒\nهاتف: ${SYSTEM_CONFIG.CONTACT.PHONE}`,
  'شحن': 'نوصل لجميع مدن المملكة خلال 2-5 أيام عمل.\n• 200 ريال فأكثر: توصيل مجاني 🎉\n• أقل من 200: رسوم حسب المنطقة',
  'اتصال': `تواصل معنا:\n📞 ${SYSTEM_CONFIG.CONTACT.PHONE}\n📱 واتساب: ${SYSTEM_CONFIG.CONTACT.WHATSAPP}\n✉️ ${SYSTEM_CONFIG.CONTACT.EMAIL}`,
  'عنوان': `${COMPANY_INFO.address || 'المملكة العربية السعودية - جدة'}`,
};

const AiAssistant: React.FC<AiAssistantProps> = memo(
  ({ isOpen, onClose, systemPrompt, onFetchOrder, initialMessage, onNavigate }) => {
    const { user, isAuthenticated } = useAuth();
    const { products } = useProducts();
    const { items: cart } = useCart();
    const { ads, categories } = useFirebase();
    const { isOnline } = useApp();

    const [messages, setMessages] = useState<Message[]>([{
      id: 'welcome',
      role: 'assistant',
      content: initialMessage ||
        `مرحباً بك في متجر نجوم دلتا! 🌟\nأنا عدي، مساعدك الذكي وموجهك الصوتي المباشر.\n\nيمكنني تقديم المساعدة الفورية لجميع العملاء وضمان التصفح الصوتي الشامل لضعاف البصر:\n• استعراض المنتجات والأسعار المعتمدة\n• إرشادات الأوامر الصوتية (Alt + V)\n• تتبع الطلبات والمساعدة في إتمام الشراء\n• عروض الشحن المجاني للطلبات فوق 200 ريال`,
      timestamp: new Date(),
      actions: [
        { label: '🏠 العودة للمتجر الرئيسي', value: 'العودة للمتجر الرئيسي' },
        { label: '🛍️ المنتجات والأسعار', value: 'عرض المنتجات' },
        { label: '👁️ مساعدة ضعاف البصر', value: 'مساعدة ضعاف البصر' },
        { label: '📦 طلباتي', value: 'طلباتي' },
        { label: '📞 تواصل', value: 'اتصال' },
      ],
    }]);

    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const typingIntervalRef = useRef<any>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
      if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
    }, [isOpen]);

    useEffect(() => {
      return () => {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
      };
    }, []);

    const addMessage = useCallback((role: Message['role'], content: string, actions?: QuickAction[]) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role, content, timestamp: new Date(), actions,
      }]);
    }, []);

    const typeMessage = useCallback((content: string, actions?: QuickAction[]) => {
      setIsTyping(true);
      const typingId = Date.now().toString();
      setMessages(prev => [...prev, { id: typingId, role: 'assistant', content: '', timestamp: new Date(), isTyping: true }]);
      let i = 0;
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      typingIntervalRef.current = setInterval(() => {
        if (i < content.length) {
          setMessages(prev => prev.map(m => m.id === typingId ? { ...m, content: content.slice(0, i + 1) } : m));
          i++;
        } else {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setMessages(prev => prev.map(m => m.id === typingId ? { ...m, isTyping: false, content, actions } : m));
          setIsTyping(false);
        }
      }, 18);
    }, []);

    const processUserMessage = useCallback(async (text: string) => {
      const lower = text.toLowerCase().trim();

      // Check return/navigation intent
      if (lower === 'رجوع' || lower === 'عودة' || lower === 'العودة' || lower.includes('العودة للمتجر') || lower === 'خروج' || lower === 'إغلاق') {
        typeMessage('جاري العودة للمتجر الرئيسي... تسوقاً سعيداً! 🛍️');
        setTimeout(() => {
          if (onNavigate) onNavigate('home');
          onClose();
        }, 600);
        return;
      }

      // FAQ lookup
      for (const [key, response] of Object.entries(FAQ)) {
        if (lower.includes(key.toLowerCase())) { typeMessage(response); return; }
      }

      // Product search
      const activeProducts = (products && products.length > 0) ? products : REAL_PRODUCTS;
      const prodMatch = lower.match(/(سعر|بحث|منتج|product)\s*(.+?)$/i);
      let searchTerm: string | null = prodMatch ? prodMatch[2].trim() : null;

      // Broader natural-language fallback: if no explicit trigger phrase matched,
      // check whether any real product name appears anywhere in the message
      // (handles "كم سعر التفاح؟", "عندكم موز؟", "هل يوجد خيار؟", etc.)
      let naturalMatches: any[] = [];
      if (!searchTerm && activeProducts?.length > 0) {
        const cleaned = lower.replace(/[؟?!.,]/g, ' ').trim();
        naturalMatches = (activeProducts as any[]).filter(p => {
          const name = (p.name_ar || p.name || '').toLowerCase();
          return name.length > 1 && (cleaned.includes(name) ||
            name.split(' ').some((w: string) => w.length > 2 && cleaned.includes(w)));
        });
      }

      if ((searchTerm && activeProducts?.length > 0) || naturalMatches.length > 0) {
        const found = searchTerm
          ? (activeProducts as any[]).filter(p =>
              (p.name_ar || p.name || '').toLowerCase().includes(searchTerm as string) ||
              (p.name_en || '').toLowerCase().includes(searchTerm as string))
          : naturalMatches;
        const term = searchTerm || text;
        if (found.length > 0) {
          const list = found.slice(0, 10).map((p: any) =>
            `• ${p.name_ar || p.name} — ${p.price} ريال ${(p.stock_quantity !== undefined ? p.stock_quantity : (p.stock !== undefined ? p.stock : 10)) > 0 ? '✅ متوفر' : '❌ غير متوفر'}`
          ).join('\n');
          typeMessage(`🔍 وجدت ${found.length} منتج يطابق "${term}":\n${list}`, [{ label: 'تصفح الكل', value: 'عرض المنتجات' }]);
        } else {
          typeMessage(`❌ لم أجد "${term}" في كتالوج المتجر.\nجرّب كلمات أخرى أو تصفح صالة العرض.`, [{ label: 'صالة العرض', value: 'عرض المنتجات' }]);
        }
        return;
      }

      // Order tracking
      const orderMatch = lower.match(/(طلب|order|تتبع|track)\s*[#:]?\s*([a-zA-Z0-9\-_]+)/i);
      if (orderMatch) {
        const orderId = orderMatch[2];
        if (onFetchOrder) {
          try {
            const data = await onFetchOrder(orderId);
            if (data) {
              const emoji = data.status === 'delivered' ? '✅' : data.status === 'shipped' ? '🚚' : '⏳';
              typeMessage(`📦 طلب #${orderId}\nالحالة: ${emoji} ${data.status}\nالمجموع: ${data.total || ''} ريال`,
                [{ label: 'تتبع مباشر', value: `تتبع ${orderId}` }]);
            } else {
              typeMessage(`❌ لم أجد طلباً بالرقم "${orderId}"`);
            }
          } catch {
            typeMessage('⚠️ خطأ في جلب بيانات الطلب. حاول من صفحة تتبع الطلب.');
          }
        } else {
          typeMessage('للتتبع المباشر استخدم صفحة "تتبع الطلب" من القائمة.');
        }
        return;
      }

      // Cart
      if (lower.includes('سلة') || lower.includes('عربة') || lower.includes('مشترياتي')) {
        const c = (cart as any[]) || [];
        if (c.length > 0) {
          const items = c.map((i: any) => `• ${i.name_ar || i.name} (x${i.quantity}) — ${i.price * i.quantity} ريال`).join('\n');
          const total = c.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
          typeMessage(`🛒 سلتك:\n${items}\n\nالمجموع: ${total} ريال`,
            [{ label: 'إتمام الدفع', value: 'الذهاب للدفع' }, { label: 'تسوق أكثر', value: 'عرض المنتجات' }]);
        } else {
          typeMessage('🛒 سلتك فارغة! تصفح منتجاتنا الآن.', [{ label: 'تسوق الآن', value: 'عرض المنتجات' }]);
        }
        return;
      }

      // Promotions
      if (lower.includes('عرض') || lower.includes('خصم') || lower.includes('تخفيض')) {
        const active = ((ads as any[]) || []).filter((a: any) => a.active);
        if (active.length > 0) {
          typeMessage(`🎉 عروض اليوم:\n${active.slice(0, 4).map((a: any) => `• ${a.title}`).join('\n')}`,
            [{ label: 'شاهد العروض', value: 'صالة العروض' }]);
        } else {
          typeMessage('تابعنا لأحدث العروض! نضيفها باستمرار 🎁');
        }
        return;
      }

      // Account
      if ((lower.includes('حسابي') || lower.includes('بياناتي')) && isAuthenticated && user) {
        typeMessage(`👤 حسابك:\nالاسم: ${(user as any).displayName || 'غير محدد'}\nالبريد: ${sanitizeEmailForDisplay((user as any).email) || 'غير محدد'}`,
          [{ label: 'لوحة التحكم', value: 'الذهاب للوحة' }]);
        return;
      }

      // About us
      if (lower.includes('من نحن') || lower.includes('عن المتجر') || lower.includes('عنكم')) {
        typeMessage(`🌟 نجوم دلتا للتجارة\nمتخصصون في الخضروات والفواكه والتمور عالية الجودة.\n📍 ${COMPANY_INFO.address || 'جدة، المملكة العربية السعودية'}\n📞 ${SYSTEM_CONFIG.CONTACT.PHONE}\n🌐 deltastars.store`);
        return;
      }

      // Returns policy
      if (lower.includes('إرجاع') || lower.includes('استرجاع') || lower.includes('استبدال')) {
        typeMessage('📋 سياسة الإرجاع:\n• الإرجاع خلال 14 يوماً من الاستلام\n• المنتج بحالته الأصلية\n• التواصل: ' + SYSTEM_CONFIG.CONTACT.PHONE,
          [{ label: 'سياسة الإرجاع', value: 'الإرجاع' }]);
        return;
      }

      // Visually impaired accessibility & voice guide
      if (lower.includes('ضعيف') || lower.includes('بصر') || lower.includes('وصول') || lower.includes('قارئ') || lower.includes('أوامر صوتية')) {
        typeMessage(
          `👁️ خدمة المساعدة المخصصة لضعاف وفاقدي البصر:\n\n` +
          `أهلاً بك! يتضمن متجر نجوم دلتا نظاماً آلياً للتفاعل الصوتي الكامل وقارئ الشاشة المباشر المتوافق مع معايير الوصول العالمية.\n\n` +
          `🍎 قائمة بأبرز المنتجات والأسعار المعتمدة اليوم:\n` +
          `• تفاح أحمر فاخر: 8.50 ر.س / كجم\n` +
          `• موز طازج: 5.25 ر.س / كجم\n` +
          `• طماطم بلدي طازجة: 4.50 ر.س / كجم\n` +
          `• خيار طازج: 4.00 ر.س / كجم\n` +
          `• تمر خلاص القصيم فاخر: 25.00 ر.س / كرتون\n` +
          `• السلة العائلية المشكلة: 99.00 ر.س\n\n` +
          `🎙️ كيف يقدم المساعد "عدي" المساعدة لك؟\n` +
          `1. يمكنك ضغط مفتاح Alt + V للتحدث والتسوق الصوتي المباشر.\n` +
          `2. اطلب اسم أي صنف أو قل "ابحث عن [المنتج]".\n` +
          `3. يمكنك الاستفسار عن الشحن (التوصيل مجاني للطلبات فوق 200 ريال).\n` +
          `4. اطلب منا قراءة السلة أو توجيهك لصفحة الدفع بأمان.`,
          [
            { label: '🛍️ قائمة المنتجات', value: 'عرض المنتجات' },
            { label: '🛒 قراءة السلة', value: 'السلة' },
            { label: '📞 الدعم الهاتفي', value: 'اتصال' }
          ]
        );
        return;
      }

      // Gemini AI fallback
      setIsTyping(true);
      try {
        const fallbackProducts = (products && products.length > 0) ? products : REAL_PRODUCTS;
        // Limit client-side mapping to prevent lags or freeze on mobile, while backend remains 100% complete
        const sliceProducts = fallbackProducts.slice(0, 80);
        const denseCatalog = sliceProducts.map(p => 
          `- ${p.name_ar} (${p.name_en || ''}): السعر ${p.price} ر.س | الوحدة: ${p.unit_ar || p.price_unit || ''} | المنشأ: ${p.origin_ar || p.origin || ''} | الميزات: ${p.features_ar || p.features || ''}`
        ).join('\n');

        const sysCtx = `أنت "عدي" (Oday) المساعد الذكي الخبير لشركة نجوم دلتا للتجارة (Delta Stars Trading) - المتجر الإلكتروني الرائد للخضار والفواكه والتمور في المملكة العربية السعودية.

معلومات الشركة الموثقة:
- الاسم: ${COMPANY_INFO.name} (${COMPANY_INFO.name_en})
- الشعار: ${COMPANY_INFO.slogan}
- المقر الرئيسي: ${COMPANY_INFO.address}
- الفروع الستة: ${SYSTEM_CONFIG.BRANCHES.map(b => b.name).join('، ')}
- الهاتف الموحد: ${COMPANY_INFO.phone}
- واتساب: ${COMPANY_INFO.whatsapp}
- البريد الإلكتروني الرسمي للتسويق والدعم: ${COMPANY_INFO.email}
- الموقع الإلكتروني: ${COMPANY_INFO.website}
- الموقع المؤسسي: ${COMPANY_INFO.corporate_site}

البيانات والوثائق القانونية الموثقة:
- السجل التجاري: ${COMPANY_INFO.bank.id_number}
- شهادة ضريبية VAT (الضريبة 15% محتسبة تلقائياً في الفواتير المعتمدة من ZATCA).
- معلومات الحساب البنكي الرسمي للشركة:
  * البنك: ${COMPANY_INFO.bank.name}
  * اسم الحساب: ${COMPANY_INFO.bank.account_name}
  * رقم الحساب: ${COMPANY_INFO.bank.account_number}
  * الآيبان (IBAN): ${COMPANY_INFO.bank.iban}
  * الفرع: ${COMPANY_INFO.bank.branch}

سياسات المتجر:
- الدفع الإلكتروني آمن 100% ومتوافق مع PCI DSS. وسائل الدفع المدعومة: مدى (Mada)، فيزا (Visa)، ماستركارد (Mastercard)، Apple Pay، تمارا (Tamara)، تابي (Tabby)، والتحويل البنكي المباشر.
- الحد الأدنى للطلب: 50 ريال سعودي.
- رسوم الشحن: الشحن مجاني تماماً للطلبات بقيمة 200 ريال أو أكثر. للطلبات الأقل من 200 ريال، يتم حساب الرسوم ديناميكياً بدقة متناهية بناءً على المسافة الجغرافية (GPS) لأقرب فرع للعميل.
- سياسة الإرجاع والاستبدال: يحق للعميل الإرجاع أو الاستبدال خلال 14 يوماً من الاستلام بشرط أن يكون المنتج بحالته الأصلية.

الدليل التشغيلي والتقني للمتجر:
- الفوترة الإلكترونية: متوافقة تماماً مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA Phase 2)، وتحتوي على تشفير QR Code بتقنية Base64 لتسهيل التحقق.
- نظام التتبع الجغرافي (FleetRadar GPS): يحسب نطاق التغطية آلياً عبر خوارزمية Haversine لتوجيه الطلب لأقرب فرع وأقرب مندوب شحن، مع إمكانية تحديث حالة التوصيل وإثبات التسليم بالتوقيع الإلكتروني على هاتف السائق.
- نظام التحديث التلقائي (UpdateManager): يقوم بإجبار المتصفحات على مسح الكاش واستدعاء أحدث كود برمجياً لضمان استقرار التطبيق بنسبة 100%.

كتالوج المنتجات الكامل والحقيقي (235+ منتج معتمد لنجوم دلتا):
${denseCatalog}

قواعد التفاعل لـ "عدي":
1. ردّ دائماً بـ اللغة العربية الفصحى الودية والمحترفة وبشكل دقيق وسريع جداً.
2. استخدم البيانات الحقيقية والأسعار والميزات المذكورة في الكتالوج أعلاه بشكل قطعي وصارم. لا تخترع أي منتجات أو أسعار أو معلومات وهمية أو غير دقيقة.
3. إذا سألك العميل عن أسعار أو مواصفات صنف معين، أجب عليه فوراً بالمعلومات الموثقة مع ذكر الوحدة والمنشأ والميزات.
4. حافظ على سرية وخصوصية الحسابات والبيانات الحساسة لشركاء قطاع الأعمال (B2B).
5. لا تذكر أي شارات أو أسماء لشركات ذكاء اصطناعي أخرى (مثل Manus, OpenAI, ChatGPT, Gemini, Claude, Copilot) إطلاقاً، وتصرف كبرنامج سيادي مدمج بالكامل لمتجر نجوم دلتا.
6. وجّه العميل دائماً للروابط المناسبة مثل تصفح المنتجات أو سلة الشراء أو تتبع الطلبات أو الدفع عند الحاجة وتمنى له تسوقاً سعيداً!`;

        const hist = messages.filter(m => m.role !== 'system').slice(-6).map(m => ({
          role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          content: m.content,
        }));
        const reply = await chatWithOday([...hist, { role: 'user', content: text }], sysCtx, fallbackProducts);
        typeMessage(reply);
      } catch {
        typeMessage(`🤔 لم أستطع الإجابة الآن.\nتواصل معنا:\n📞 ${SYSTEM_CONFIG.CONTACT.PHONE}\n📱 واتساب: ${SYSTEM_CONFIG.CONTACT.WHATSAPP}`,
          [{ label: 'مساعدة', value: 'مساعدة' }, { label: 'منتجات', value: 'عرض المنتجات' }]);
      } finally {
        setIsTyping(false);
      }
    }, [products, cart, ads, categories, user, isAuthenticated, onFetchOrder, messages, typeMessage]);

    const handleQuickAction = useCallback((actionValue: string) => {
      if (actionValue === 'العودة للمتجر الرئيسي' || actionValue === 'العودة للمتجر' || actionValue === 'خروج') {
        if (onNavigate) onNavigate('home');
        onClose();
        return;
      }
      if (actionValue === 'عرض المنتجات') {
        if (onNavigate) {
          onNavigate('home');
          onClose();
          return;
        }
      }
      if (actionValue === 'طلباتي') {
        if (onNavigate) {
          onNavigate('order_history');
          onClose();
          return;
        }
      }
      if (actionValue === 'الذهاب للدفع' || actionValue === 'السلة') {
        if (onNavigate) {
          onNavigate('cart');
          onClose();
          return;
        }
      }
      if (actionValue === 'الذهاب للوحة') {
        if (onNavigate) {
          onNavigate('vip_dashboard');
          onClose();
          return;
        }
      }
      if (actionValue === 'اتصال') {
        if (onNavigate) {
          onNavigate('contact');
          onClose();
          return;
        }
      }

      addMessage('user', actionValue);
      setShowQuickActions(false);
      processUserMessage(actionValue);
    }, [onNavigate, onClose, addMessage, processUserMessage]);

    const handleSend = useCallback(async () => {
      const text = inputValue.trim();
      if (!text) return;
      addMessage('user', text);
      setInputValue('');
      setShowQuickActions(false);
      await processUserMessage(text);
    }, [inputValue, addMessage, processUserMessage]);

    const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    }, [handleSend]);

    const formatTime = (d: Date) =>
      d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md transition-opacity overflow-hidden">
        {/* Backdrop click to return */}
        <div className="absolute inset-0 cursor-pointer z-0" onClick={onClose} title="انقر هنا للعودة للمتجر" />

        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10 w-full sm:w-[520px] h-[92vh] sm:h-[680px] max-h-[96vh] bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700/80 overflow-hidden flex flex-col"
          style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
          dir="rtl"
        >
          {/* Mobile Drag/Close Handle Bar */}
          <div 
            onClick={onClose} 
            className="w-full bg-emerald-950 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-900 transition-colors shrink-0 z-20 border-b border-emerald-800/40"
            title="انقر هنا للعودة إلى المتجر الرئيسي"
          >
            <div className="w-12 h-1 bg-amber-400 rounded-full" />
            <span className="text-[11px] font-bold text-amber-300">العودة للمتجر الرئيسي (انقر لإغلاق الشاشة)</span>
          </div>

          {/* Main Header */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-3 sm:p-4 flex items-center justify-between shrink-0 shadow-lg border-b border-emerald-600/30 gap-2 z-20">
            {/* Right Return Button */}
            <button
              onClick={() => {
                if (onNavigate) onNavigate('home');
                onClose();
              }}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-md border border-amber-300/60 transition-all shrink-0 cursor-pointer"
              title="العودة المباشرة للمتجر الرئيسي"
            >
              <ArrowRightIcon className="w-4 h-4 text-slate-950" />
              <span className="whitespace-nowrap">العودة للمتجر</span>
            </button>

            {/* Center Info */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0 relative">
                <CpuChipIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
                {isTyping && (
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-amber-400 border-2 border-emerald-800 rounded-full animate-ping" />
                )}
              </div>
              <div className="text-right min-w-0 truncate">
                <h3 className="text-white font-black text-sm sm:text-base flex items-center gap-1 truncate">
                  <span>عدي</span>
                  <SparklesIcon className="w-3.5 h-3.5 text-yellow-300 animate-pulse shrink-0" />
                </h3>
                <div className="text-emerald-200 text-[10px] sm:text-xs flex items-center gap-1 font-medium truncate">
                  <span className={`w-2 h-2 rounded-full inline-block shrink-0 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className="truncate">{isOnline ? 'مساعدك الذكي — متصل' : 'غير متصل'}</span>
                </div>
              </div>
            </div>

            {/* Left X Close Button */}
            <button
              onClick={onClose}
              className="p-2 sm:px-3 bg-red-600/90 hover:bg-red-600 active:scale-95 rounded-xl transition-all text-white shadow-md shrink-0 flex items-center gap-1 cursor-pointer z-30"
              aria-label="إغلاق الشاشة والعودة"
              title="إغلاق الشاشة والعودة"
            >
              <XMarkIcon className="w-5 h-5" />
              <span className="text-xs font-bold hidden sm:inline">إغلاق</span>
            </button>
          </div>

          {/* Quick Navigation Banner Bar */}
          <div className="bg-emerald-950 dark:bg-slate-950 border-b border-emerald-500/20 px-3 py-1.5 flex items-center justify-between text-xs text-emerald-100 shadow-inner shrink-0">
            <div className="flex items-center gap-1.5 font-bold truncate">
              <HomeIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate text-[11px] sm:text-xs">المساعد الذكي لنجوم دلتا</span>
            </div>
            <button
              onClick={() => {
                if (onNavigate) onNavigate('home');
                onClose();
              }}
              className="text-amber-300 hover:text-white font-black underline text-[11px] sm:text-xs flex items-center gap-1 shrink-0 hover:scale-105 transition-all"
            >
              <span>🏠 تصفح المنتجات</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 dark:bg-slate-800/50 min-h-[300px]">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white rounded-bl-none'
                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-br-none border border-slate-100 dark:border-slate-600'
                    }`}
                  >
                    {msg.role !== 'user' && (
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-600 pb-1.5 mb-2 text-emerald-600 dark:text-emerald-400">
                        <div className="flex items-center gap-1.5">
                          <CpuChipIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">عدي</span>
                        </div>
                        {msg.isTyping && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                            <SpeakerIcon className="w-3 h-3 animate-pulse" />
                            <span>توليد الرد الصوتـي</span>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.isTyping ? (
                      <div className="flex items-center gap-3 py-1.5">
                        <AudioWaveform size="sm" color="bg-emerald-500 dark:bg-emerald-400" barsCount={9} />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-300 animate-pulse">
                          جاري صياغة الإجابة...
                        </span>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <p className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.timestamp)}
                  </p>
                  {/* Quick action buttons */}
                  {msg.actions && msg.actions.length > 0 && !msg.isTyping && (
                    <div className="flex flex-wrap gap-2 mt-2.5">
                      {msg.actions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickAction(action.value)}
                          className="text-xs bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 rounded-xl px-3 py-1.5 hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 transition-all font-bold shadow-sm flex items-center gap-1"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`flex-shrink-0 ${msg.role === 'user' ? 'order-1 ml-2' : 'order-2 mr-2'}`}>
                  {msg.role === 'user' ? (
                    <UserCircleIcon className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <CpuChipIcon className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

              {/* Typing indicator fallback with Waveform */}
              {isTyping && !messages.some(m => m.isTyping) && (
                <div className="flex justify-end">
                  <div className="bg-white dark:bg-slate-700 rounded-2xl rounded-br-none px-4 py-3 shadow-sm border border-slate-100 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <AudioWaveform size="sm" color="bg-amber-400" barsCount={7} />
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-300">
                        عدي يحضر لك الرد الآن...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex-shrink-0">
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 px-3 py-2 bg-gradient-to-r from-emerald-900/90 via-slate-900 to-teal-950 text-white rounded-xl border border-emerald-500/30 flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                      <SpeakerIcon className="w-4 h-4 animate-pulse text-amber-400" />
                      <span>المساعد الذكي "عدي" يتفاعل ويتحدث معك الآن...</span>
                    </div>
                    <AudioWaveform size="sm" color="bg-emerald-400" barsCount={8} />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="اكتب رسالتك..."
                  disabled={isTyping}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition-all disabled:opacity-50"
                  dir="rtl"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="w-10 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
                  aria-label="إرسال"
                >
                  <PaperAirplaneIcon className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-2">
                مساعد نجوم دلتا الذكي
              </p>
            </div>
          </motion.div>
      </div>
    );
  }
);

AiAssistant.displayName = 'AiAssistant';
export default AiAssistant;
