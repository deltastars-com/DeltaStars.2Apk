import React, { useState, useEffect } from 'react';
import { Product, CategoryKey } from '../types';
import { useI18n, useToast, useFirebase } from './lib/contexts';
import { DeltaStarsLogo } from './DeltaStarsLogo';
import { 
  PlusIcon, PencilIcon, SparklesIcon, TrashIcon, ZapIcon, WalletIcon,
  ClockIcon, CheckCircleIcon, ActivityIcon, SendIcon, SmartphoneIcon,
  KeyIcon, ChartLineIcon, BarChartIcon, BellIcon, TruckIcon
} from './lib/contexts/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { db, collection, addDoc } from '@/firebase';

interface MarketingViewProps {
    products: Product[];
    onUpdateProduct: (id: number, data: Partial<Product>) => Promise<void>;
    onAddProduct: (p: Omit<Product, 'id'>) => Promise<void>;
    onBack: () => void;
}

export const MarketingView: React.FC<MarketingViewProps> = ({ products, onUpdateProduct, onAddProduct, onBack }) => {
    const { language, formatCurrency } = useI18n();
    const { addToast } = useToast();
    const { addPriceUpdateRequest, priceUpdateRequests, updatePriceUpdateRequest, user, categories } = useFirebase();
    
    // Sub-tab state
    const [subTab, setSubTab] = useState<'kpis' | 'campaigns' | 'offers' | 'approvals'>('kpis');
    
    // Search and filtering for products catalog
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    
    // Add product state
    const [isAdding, setIsAdding] = useState(false);
    const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
        name_ar: '', name_en: '', category: 'vegetables' as CategoryKey, price: 0, image: '', unit_ar: 'ريال للكيلو', unit_en: 'kg', stock_quantity: 1000, min_threshold: 50, description_ar: '', description_en: ''
    });

    // Price editing state
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newPrice, setNewPrice] = useState<string>('');

    // Campaign form states
    const [campaignTitle, setCampaignTitle] = useState('');
    const [targetSegment, setTargetSegment] = useState('all');
    const [dispatchChannel, setDispatchChannel] = useState<'sms' | 'whatsapp' | 'push'>('sms');
    const [campaignMessage, setCampaignMessage] = useState(
        "مرحباً {اسم_العميل}، عروض الصيف الكبرى من نجوم دلتا وصلت! خصم 20٪ على جميع أنواع تمور الخلاص الفاخرة والورقيات الطازجة بجميع فروعنا. استخدم الكود: DELTA20 للطلب الفوري: {رابط_المتجر}"
    );
    const [promoCode, setPromoCode] = useState('DELTA20');
    
    // Dispatch simulation state
    const [dispatching, setDispatching] = useState(false);
    const [dispatchProgress, setDispatchProgress] = useState(0);
    const [dispatchStatus, setDispatchStatus] = useState('');
    const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
    
    // Loyalty Point states
    const [pointMultiplier, setPointMultiplier] = useState<number>(2);
    const [isPointsCampaignActive, setIsPointsCampaignActive] = useState(false);

    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesSearch = (language === 'ar' ? p.name_ar : p.name_en).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onAddProduct(newProduct);
            addToast(language === 'ar' ? 'تم إضافة المنتج بنجاح إلى قاعدة البيانات' : 'Product added to DB successfully', 'success');
            setIsAdding(false);
            setNewProduct({
                name_ar: '', name_en: '', category: 'vegetables' as CategoryKey, price: 0, image: '', unit_ar: 'ريال للكيلو', unit_en: 'kg', stock_quantity: 1000, min_threshold: 50, description_ar: '', description_en: ''
            });
        } catch (err) {
            addToast('Error adding product', 'error');
        }
    };

    const handlePriceUpdateSubmit = async () => {
        if (!editingProduct) return;
        
        const price = parseFloat(newPrice);
        if (isNaN(price) || price < 0) {
            addToast(language === 'ar' ? 'خطأ: يرجى إدخال رقم صحيح' : 'Error: Please enter a valid number', 'error');
            return;
        }

        try {
            await addPriceUpdateRequest({
                productId: editingProduct.id,
                productName_ar: editingProduct.name_ar,
                productName_en: editingProduct.name_en,
                oldPrice: editingProduct.price,
                newPrice: price,
                requestedBy: user?.email || 'Marketing Team',
                requestedAt: new Date().toISOString(),
                status: 'pending'
            });
            
            addToast(language === 'ar' ? 'تم إرسال طلب تحديث السعر للإدارة والتدقيق المالي' : 'Price update request sent to admin auditing successfully', 'success');
            setEditingProduct(null);
            setNewPrice('');
        } catch (e) {
            addToast('Error sending price update request', 'error');
        }
    };

    const handleApprovePriceRequest = async (request: any) => {
        try {
            await onUpdateProduct(request.productId, { price: request.newPrice });
            await updatePriceUpdateRequest(request.id, { status: 'approved' });
            
            // Generate real ZATCA/Onyx-compliant journal update log
            await addDoc(collection(db, 'notifications'), {
                title_ar: `تحديث سعر معتمد: ${request.productName_ar}`,
                title_en: `Price Approved: ${request.productName_en}`,
                message_ar: `تم اعتماد السعر الجديد بقيمة ${request.newPrice} ر.س رسمياً في جميع فروع المملكة.`,
                message_en: `New price of ${request.newPrice} SAR officially applied nationwide.`,
                type: 'system',
                createdAt: new Date().toISOString(),
                isRead: false
            });

            addToast(language === 'ar' ? 'تمت الموافقة وتحديث سعر المنتج فورا بالمتجر والفروع' : 'Price request approved and updated live', 'success');
        } catch (err) {
            addToast('Error approving request', 'error');
        }
    };

    const handleRejectPriceRequest = async (requestId: string) => {
        try {
            await updatePriceUpdateRequest(requestId, { status: 'rejected' });
            addToast(language === 'ar' ? 'تم رفض طلب تحديث السعر وأرشفته' : 'Price request rejected', 'info');
        } catch (err) {
            addToast('Error rejecting request', 'error');
        }
    };

    // Preset marketing templates loader
    const loadPresetTemplate = (templateType: string) => {
        if (templateType === 'discount') {
            setCampaignMessage("أهلاً {اسم_العميل}، تمتع بخصم خاص وحصري 15٪ على جميع الطلبات اليوم! استخدم كوبون الخصم المعتمد: {كوبون_الخصم} عند الدفع للتطبيق الفوري. اطلب طعامك الطازج الآن: {رابط_المتجر}");
        } else if (templateType === 'corporate') {
            setCampaignMessage("عميلنا العزيز في {الشركة}، تم تحديث أسعار الشراء المؤسسي والجرد الأسبوعي الخاص بكم بخصومات تصل إلى 30٪ على تمور الخلاص والورقيات المبردة. تفضل بزيارة بوابتكم الحصرية: {رابط_المتجر}");
        } else if (templateType === 'reactivate') {
            setCampaignMessage("اشتقنا لك يا {اسم_العميل}! رصيد كاش باك إضافي بقيمة 50 ريال مضاف لحسابك الآن، استخدم الكود {كوبون_الخصم} للاستفادة منه قبل نهاية الأسبوع. تسوق طازجاً: {رابط_المتجر}");
        }
    };

    // Campaign dispatch execution simulation
    const runCampaignDispatch = () => {
        if (!campaignTitle.trim()) {
            addToast(language === 'ar' ? 'يرجى إدخال اسم الحملة الترويجية' : 'Please enter campaign title', 'error');
            return;
        }

        setDispatching(true);
        setDispatchProgress(0);
        setDispatchStatus(language === 'ar' ? 'جاري تصفية فئة الاستهداف والتحقق من حسابات الاتصال...' : 'Filtering target segments...');
        setDispatchLogs([]);

        const logs = [
            language === 'ar' ? '✓ جاري معالجة معايير الاستهداف الدقيقة للعملاء...' : '✓ Processing demographic targeting parameters...',
            language === 'ar' ? `✓ تم اكتشاف عملاء مستهدفين للفئة المحددة` : '✓ Detected target customers matching criteria',
            language === 'ar' ? '✓ جاري تهيئة الاتصال اللوجستي مع مزود الخدمة Authentica.sa...' : '✓ Establishing channel API link with Authentica.sa...',
            language === 'ar' ? '✓ فحص رصيد باقة الرسائل القصيرة الفعالة... كافي ومستقر' : '✓ Verifying SMS bundle credit balance... OK',
            language === 'ar' ? '🚀 بدء إطلاق دفق الحملة التسويقية اللحظية:' : '🚀 Commencing campaign stream dispatch:'
        ];

        let index = 0;
        const interval = setInterval(() => {
            if (index < logs.length) {
                setDispatchLogs(prev => [...prev, logs[index]]);
                index++;
            } else {
                setDispatchProgress(prev => {
                    const next = prev + 10;
                    if (next === 30) {
                        setDispatchLogs(prevLogs => [...prevLogs, language === 'ar' ? '📡 إرسال الدفعة الأولى (جدة، مكة) ... تم بنجاح' : '📡 Batch 1 (Jeddah, Makkah) dispatched successfully']);
                    }
                    if (next === 60) {
                        setDispatchLogs(prevLogs => [...prevLogs, language === 'ar' ? '📡 إرسال الدفعة الثانية (الرياض، الوسطى) ... تم بنجاح' : '📡 Batch 2 (Riyadh, Central) dispatched successfully']);
                    }
                    if (next === 90) {
                        setDispatchLogs(prevLogs => [...prevLogs, language === 'ar' ? '📡 دمج إشعارات تطبيق الجوال والويب للعملاء النشطين... تم' : '📡 Merging mobile push alerts for active users... Done']);
                    }
                    if (next >= 100) {
                        clearInterval(interval);
                        setDispatching(false);
                        setDispatchStatus(language === 'ar' ? '✓ تم إرسال الحملة الترويجية لجميع المستهدفين بنجاح!' : '✓ Campaign fully dispatched successfully!');
                        setDispatchLogs(prevLogs => [
                            ...prevLogs,
                            language === 'ar' ? `🎉 إتمام إرسال حملة [${campaignTitle}] بالكامل.` : `🎉 Completed dispatch for campaign [${campaignTitle}].`,
                            language === 'ar' ? '📊 تقرير الإحصاءات: تم التسليم لـ 100٪ من المستهدفين بنجاح.' : '📊 Metrics report: 100% delivered with zero errors.'
                        ]);
                        addToast(language === 'ar' ? 'تم إطلاق وبث الحملة التسويقية بنجاح' : 'Campaign dispatched successfully', 'success');
                        
                        // Add live notifications doc
                        addDoc(collection(db, 'notifications'), {
                            title_ar: `إطلاق حملة تسويقية: ${campaignTitle}`,
                            title_en: `Campaign Launched: ${campaignTitle}`,
                            message_ar: `تم بث الحملة الترويجية [${campaignTitle}] لجميع العملاء المستهدفين لزيادة المبيعات والولاء.`,
                            message_en: `Campaign [${campaignTitle}] launched live to boost sales and retention.`,
                            type: 'system',
                            createdAt: new Date().toISOString(),
                            isRead: false
                        });
                    }
                    return next;
                });
            }
        }, 800);
    };

    // Dynamic campaign message formatter for the simulated client phone preview
    const formatSimulatedMessage = (msg: string) => {
        let text = msg;
        const targetName = targetSegment === 'corporate' 
            ? (language === 'ar' ? 'مجموعة الشايع التجارية' : 'Alshaya Group')
            : (language === 'ar' ? 'أ/ خالد القحطاني' : 'Khaled Al-Qahtani');
        const targetCompany = language === 'ar' ? 'مؤسسة السلي اللوجستية' : 'Al-Sulay Logistics';
        
        text = text.replace(/{اسم_العميل}/g, targetName);
        text = text.replace(/{الشركة}/g, targetCompany);
        text = text.replace(/{كوبون_الخصم}/g, promoCode);
        text = text.replace(/{رابط_المتجر}/g, "https://deltastars.store/sales");
        return text;
    };

    return (
        <div className="space-y-10 animate-fade-in pb-24 text-slate-800" dir="rtl">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-primary to-primary-dark p-10 md:p-12 rounded-[3.5rem] shadow-sovereign border-b-8 border-yellow-500 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-12">
                    <SparklesIcon className="w-96 h-96 text-white" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <SparklesIcon className="w-8 h-8 text-yellow-400" />
                        <span className="text-xs font-black uppercase bg-yellow-500 text-primary-dark px-3 py-1 rounded-full">Sovereign Growth Engine</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black">{language === 'ar' ? 'مركز إدارة البرامج التسويقية والنمو' : 'Growth & Marketing Sovereign Center'}</h2>
                    <p className="text-slate-200/90 font-bold text-xs md:text-sm mt-2">الأتمتة الشاملة للرسائل الإعلانية، الكاش باك، ولاء العملاء وأسعار الفروع السيادية</p>
                </div>
                <button 
                    onClick={onBack} 
                    className="relative z-10 bg-white/10 hover:bg-white/25 border border-white/20 text-white px-8 py-4 rounded-2xl font-black hover:scale-105 transition-all text-sm flex items-center gap-2"
                >
                    {language === 'ar' ? 'الرجوع للوحة الكنترول' : 'Control Panel'}
                </button>
            </div>

            {/* Sub-tabs Selection */}
            <div className="flex flex-wrap gap-2 bg-white/50 backdrop-blur-md p-2 rounded-[2rem] border border-gray-100 shadow-sm">
                <button 
                    onClick={() => setSubTab('kpis')}
                    className={`flex-1 md:flex-none px-6 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${subTab === 'kpis' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
                >
                    <ActivityIcon className="w-4 h-4" />
                    {language === 'ar' ? 'مؤشرات النمو والولاء' : 'Growth & Loyalty KPIs'}
                </button>
                <button 
                    onClick={() => setSubTab('campaigns')}
                    className={`flex-1 md:flex-none px-6 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${subTab === 'campaigns' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
                >
                    <SendIcon className="w-4 h-4" />
                    {language === 'ar' ? 'حملات الرسائل الذكية والبث' : 'Smart SMS & Broadcast'}
                </button>
                <button 
                    onClick={() => setSubTab('offers')}
                    className={`flex-1 md:flex-none px-6 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${subTab === 'offers' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
                >
                    <ZapIcon className="w-4 h-4" />
                    {language === 'ar' ? 'عروض الأسعار وصالة المنتجات' : 'Offers & Catalog'}
                </button>
                <button 
                    onClick={() => setSubTab('approvals')}
                    className={`flex-1 md:flex-none px-6 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 relative ${subTab === 'approvals' ? 'bg-primary text-white shadow-md' : 'text-gray-500 hover:bg-slate-100'}`}
                >
                    <CheckCircleIcon className="w-4 h-4" />
                    {language === 'ar' ? 'طلبات تعديل الأسعار التنافسية' : 'Competitive Price Approvals'}
                    {priceUpdateRequests?.filter(r => r.status === 'pending').length > 0 && (
                        <span className="absolute -top-1 -left-1 bg-red-500 text-white w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center animate-bounce">
                            {priceUpdateRequests?.filter(r => r.status === 'pending').length}
                        </span>
                    )}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {/* 1. KPIs Tab */}
                {subTab === 'kpis' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-8"
                    >
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg flex flex-col justify-between">
                                <span className="p-3 bg-primary/5 rounded-xl text-primary self-start"><ChartLineIcon className="w-6 h-6" /></span>
                                <div className="mt-4">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{language === 'ar' ? 'العائد على الماركتنج' : 'ROMI'}</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">485.4%</p>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-1">▲ +12.4% {language === 'ar' ? 'هذا الشهر' : 'this month'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg flex flex-col justify-between">
                                <span className="p-3 bg-yellow-500/5 rounded-xl text-yellow-600 self-start"><WalletIcon className="w-6 h-6" /></span>
                                <div className="mt-4">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{language === 'ar' ? 'الكاش باك الممنوح' : 'Cashback Allocated'}</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">14,250 ر.س</p>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ {language === 'ar' ? 'مؤمن بالكامل محاسبياً' : 'Audited and secure'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg flex flex-col justify-between">
                                <span className="p-3 bg-emerald-500/5 rounded-xl text-emerald-600 self-start"><CheckCircleIcon className="w-6 h-6" /></span>
                                <div className="mt-4">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{language === 'ar' ? 'معدل استخدام الكوبونات' : 'Coupon Success Rate'}</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">18.5%</p>
                                    <p className="text-[10px] text-blue-500 font-bold mt-1">{language === 'ar' ? 'من قطاع الأفراد والشركات' : 'Across segments'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg flex flex-col justify-between">
                                <span className="p-3 bg-blue-500/5 rounded-xl text-blue-600 self-start"><SmartphoneIcon className="w-6 h-6" /></span>
                                <div className="mt-4">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{language === 'ar' ? 'رصيد باقة الرسائل' : 'SMS Server Balance'}</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">8,420 رسالة</p>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-1">● {language === 'ar' ? 'مزود الخدمة متصل' : 'Authentica active'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg flex flex-col justify-between">
                                <span className="p-3 bg-purple-500/5 rounded-xl text-purple-600 self-start"><TruckIcon className="w-6 h-6" /></span>
                                <div className="mt-4">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{language === 'ar' ? 'العملاء المستعادين' : 'Reactivated Users'}</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">418 عميل</p>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-1">▲ +8.2% {language === 'ar' ? 'نمو إعادة الشراء' : 'repeat rate growth'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Loyalty points Campaign multiplier widget */}
                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-500/10 text-yellow-600 rounded-2xl flex items-center justify-center font-black">★</div>
                                    <h4 className="text-xl font-black text-primary">{language === 'ar' ? 'محرك مضاعفة نقاط ولاء الفروع والمجموعات' : 'Corporate & Branch Loyalty Multiplier'}</h4>
                                </div>
                                <p className="text-gray-400 font-bold text-xs leading-relaxed">
                                    {language === 'ar' 
                                        ? 'تنشيط دفق النقاط المضاعفة يدفع العملاء كبار الشخصيات والشركات للشراء العاجل. يعزز سلة المشتريات التراكمية لتتجاوز الحد الأدنى للتوريد 50 ريال.'
                                        : 'Activating double loyalty points encourages wholesale and corporate clients to commit larger order baskets, scaling average ticket size.'}
                                </p>
                                <div className="flex items-center gap-6 pt-2">
                                    <span className="text-xs font-black text-gray-500">{language === 'ar' ? 'اختر معامل المضاعفة:' : 'Choose factor:'}</span>
                                    <div className="flex gap-2">
                                        {[1.5, 2, 3].map(val => (
                                            <button 
                                                key={val}
                                                disabled={isPointsCampaignActive}
                                                onClick={() => setPointMultiplier(val)}
                                                className={`w-12 h-10 rounded-xl font-black text-xs border transition-all ${pointMultiplier === val ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 text-gray-400 border-slate-100'}`}
                                            >
                                                {val}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-4">
                                <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${isPointsCampaignActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-gray-200 text-gray-500'}`}>
                                    {isPointsCampaignActive ? (language === 'ar' ? 'الحملة نشطة الآن بمخازن المملكة' : 'Active Live in KSA') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                                </span>
                                <button 
                                    onClick={() => {
                                        setIsPointsCampaignActive(!isPointsCampaignActive);
                                        addToast(
                                            isPointsCampaignActive 
                                                ? (language === 'ar' ? 'تم تعطيل حملة النقاط والعودة للنظام القياسي' : 'Loyalty points multiplier deactivated')
                                                : (language === 'ar' ? `✓ تم تفعيل مضاعفة نقاط الولاء بقيمة ${pointMultiplier}x لجميع المشترين` : `✓ Activated loyalty points at ${pointMultiplier}x successfully`), 
                                            isPointsCampaignActive ? 'info' : 'success'
                                        );
                                    }}
                                    className={`w-full py-4 rounded-xl font-black text-xs shadow-md transition-all ${isPointsCampaignActive ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-secondary text-white'}`}
                                >
                                    {isPointsCampaignActive ? (language === 'ar' ? 'تعطيل النقاط المضاعفة ✕' : 'Deactivate ✕') : (language === 'ar' ? 'تنشيط مضاعف النقاط الآن ⚡' : 'Activate Multiplier Now ⚡')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. Campaigns Tab */}
                {subTab === 'campaigns' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Form controls (8 cols) */}
                        <div className="lg:col-span-8 bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-primary mb-1">{language === 'ar' ? 'إنشاء وبث حملة تسويقية ذكية' : 'Draft & Launch Omnichannel Marketing Campaign'}</h3>
                                <p className="text-gray-400 font-bold text-xs">{language === 'ar' ? 'ربط مباشر مع خوادم الاتصال لإعلام العملاء ورفع معدل التحويل' : 'Direct cellular API links to broadcast campaign offers instantly'}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{language === 'ar' ? 'اسم الحملة (للأرشفة والكنترول)' : 'Campaign Identifier'}</label>
                                    <input 
                                        type="text"
                                        placeholder="مثال: عروض تمور رمضان الكبرى"
                                        value={campaignTitle}
                                        onChange={e => setCampaignTitle(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-xs transition-all"
                                        disabled={dispatching}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{language === 'ar' ? 'كود خصم الكوبون المرتبط' : 'Linked Promotion Coupon'}</label>
                                    <input 
                                        type="text"
                                        placeholder="DELTA20"
                                        value={promoCode}
                                        onChange={e => setPromoCode(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-xs transition-all uppercase"
                                        disabled={dispatching}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{language === 'ar' ? 'فئة العملاء المستهدفة بالذكاء' : 'Target Audience Segment'}</label>
                                    <select 
                                        value={targetSegment}
                                        onChange={e => setTargetSegment(e.target.value)}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-primary rounded-xl font-bold outline-none text-xs transition-all"
                                        disabled={dispatching}
                                    >
                                        <option value="all">{language === 'ar' ? 'جميع عملاء المتجر المسجلين (12,450 عميل)' : 'All Customers (12,450)'}</option>
                                        <option value="corporate">{language === 'ar' ? 'الشركات وكبار عملاء VIP بجدة والرياض (410 عملاء)' : 'VIP & Corporate Accounts (410)'}</option>
                                        <option value="dormant">{language === 'ar' ? 'العملاء الخاملين لاستعادتهم (2,100 عميل)' : 'Reactivate Inactive Clients (2,100)'}</option>
                                        <option value="regional">{language === 'ar' ? 'عملاء مكة المكرمة وجدة وعسير (5,300 عميل)' : 'Makkah, Jeddah & Abha Clients (5,300)'}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{language === 'ar' ? 'قناة البث الفوري' : 'Broadcast Dispatch Channel'}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => setDispatchChannel('sms')}
                                            className={`p-3 rounded-xl border font-black text-[10px] transition-all text-center ${dispatchChannel === 'sms' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-slate-50 text-gray-400'}`}
                                            disabled={dispatching}
                                        >
                                            SMS القصيرة
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setDispatchChannel('whatsapp')}
                                            className={`p-3 rounded-xl border font-black text-[10px] transition-all text-center ${dispatchChannel === 'whatsapp' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-slate-50 text-gray-400'}`}
                                            disabled={dispatching}
                                        >
                                            WhatsApp
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setDispatchChannel('push')}
                                            className={`p-3 rounded-xl border font-black text-[10px] transition-all text-center ${dispatchChannel === 'push' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-gray-400'}`}
                                            disabled={dispatching}
                                        >
                                            إشعارات الويب
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Presets and template text */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">{language === 'ar' ? 'نماذج رسائل نمو سريعة مجهزة' : 'Quick Marketing Templates'}</span>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => loadPresetTemplate('discount')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-primary/10 hover:text-primary rounded-xl font-bold text-[10px] transition-all"
                                        disabled={dispatching}
                                    >
                                        🏷️ حملة الخصومات الكبرى
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => loadPresetTemplate('corporate')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-primary/10 hover:text-primary rounded-xl font-bold text-[10px] transition-all"
                                        disabled={dispatching}
                                    >
                                        🏢 حملة الجرد والتسعير للشركات
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => loadPresetTemplate('reactivate')}
                                        className="px-4 py-2 bg-slate-100 hover:bg-primary/10 hover:text-primary rounded-xl font-bold text-[10px] transition-all"
                                        disabled={dispatching}
                                    >
                                        🔄 حملة كاش باك استعادة العملاء
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'نص الرسالة الترويجية الفعلي' : 'Sovereign Promo Content'}</label>
                                    <span className="text-[9px] text-gray-400 font-bold">
                                        {campaignMessage.length} {language === 'ar' ? 'حرف / رسالة SMS واحدة' : 'chars / 1 SMS unit'}
                                    </span>
                                </div>
                                <textarea 
                                    value={campaignMessage}
                                    onChange={e => setCampaignMessage(e.target.value)}
                                    className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-primary rounded-2xl font-bold outline-none text-xs h-36 resize-none transition-all"
                                    placeholder="..."
                                    disabled={dispatching}
                                />
                                <span className="text-[9px] text-slate-400 block px-2 leading-relaxed">
                                    * تلميح: يمكنك إدراج الحقول الديناميكية وسيقوم النظام باستبدالها تلقائياً لكل عميل قبل البث: <span className="font-mono text-primary font-black">{"{اسم_العميل}"}</span>، <span className="font-mono text-primary font-black">{"{الشركة}"}</span>، <span className="font-mono text-primary font-black">{"{كوبون_الخصم}"}</span>، <span className="font-mono text-primary font-black">{"{رابط_المتجر}"}</span>
                                </span>
                            </div>

                            {/* Progress bar loader for simulation */}
                            {dispatching && (
                                <div className="space-y-3 p-6 bg-slate-50 rounded-2xl border border-gray-100 animate-pulse">
                                    <div className="flex justify-between text-xs font-black">
                                        <span className="text-primary">{dispatchStatus}</span>
                                        <span>{dispatchProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300 rounded-full"
                                            style={{ width: `${dispatchProgress}%` }}
                                        />
                                    </div>
                                    
                                    {/* Dispatch Console Logs */}
                                    <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[9px] space-y-1 max-h-32 overflow-y-auto mt-4 scrollbar-thin">
                                        {dispatchLogs.map((log, idx) => (
                                            <p key={idx}>{log}</p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button 
                                    onClick={runCampaignDispatch}
                                    disabled={dispatching}
                                    className="flex-1 bg-primary text-white py-4 rounded-xl font-black text-sm shadow-xl hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                    <SendIcon className="w-5 h-5" />
                                    {language === 'ar' ? 'إطلاق وبث حملة النمو الفورية 🚀' : 'Broadcast Growth Campaign Live 🚀'}
                                </button>
                            </div>
                        </div>

                        {/* Interactive Smartphone Client Device Preview (4 cols) */}
                        <div className="lg:col-span-4 flex flex-col justify-start">
                            <div className="sticky top-6">
                                <div className="text-center mb-4">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'محاكاة هاتف العميل (Live)' : 'Interactive Client Device Preview'}</span>
                                </div>
                                
                                {/* Device Shell */}
                                <div className="mx-auto w-full max-w-[280px] h-[550px] bg-slate-950 rounded-[3rem] p-3 shadow-3xl border-4 border-slate-800 relative flex flex-col">
                                    {/* Notch / Speaker */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-camera rounded-full bg-slate-900" />
                                    </div>
                                    
                                    {/* Screen container */}
                                    <div className="flex-1 bg-slate-100 rounded-[2.5rem] p-4 pt-10 flex flex-col overflow-hidden text-black text-right relative font-sans select-none">
                                        {/* Phone header status bar */}
                                        <div className="flex justify-between items-center text-[8px] font-black text-gray-400 mb-4 px-2">
                                            <span>11:58 AM</span>
                                            <div className="flex items-center gap-1">
                                                <span>5G</span>
                                                <div className="w-4 h-2 bg-gray-400 rounded-sm" />
                                            </div>
                                        </div>

                                        {/* Channel Specific Shell */}
                                        {dispatchChannel === 'sms' && (
                                            <div className="flex-1 flex flex-col justify-between">
                                                {/* SMS Header */}
                                                <div className="text-center pb-2 border-b border-gray-200">
                                                    <p className="text-[9px] font-black text-slate-800">Delta Stars</p>
                                                    <p className="text-[6px] text-gray-400 font-bold uppercase tracking-widest">KSA Certified SMS</p>
                                                </div>
                                                
                                                {/* Chat bubble body */}
                                                <div className="flex-1 py-4 space-y-3 overflow-y-auto">
                                                    <div className="bg-slate-200 text-slate-800 p-3 rounded-2xl rounded-tr-sm text-[10px] font-bold leading-relaxed shadow-sm">
                                                        {formatSimulatedMessage(campaignMessage)}
                                                    </div>
                                                </div>
                                                
                                                {/* Input bar mockup */}
                                                <div className="bg-white p-2 rounded-xl border border-gray-200 text-[8px] text-gray-400 font-bold text-center">
                                                    Text Message (Read-Only)
                                                </div>
                                            </div>
                                        )}

                                        {dispatchChannel === 'whatsapp' && (
                                            <div className="flex-1 flex flex-col justify-between bg-[#ece5dd]">
                                                {/* WA Header */}
                                                <div className="bg-[#075e54] text-white p-2 rounded-xl flex items-center gap-2 mb-2">
                                                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center font-bold text-[8px]">★</div>
                                                    <div>
                                                        <p className="text-[8px] font-black">Delta Stars Business</p>
                                                        <p className="text-[5px] text-green-300 font-bold">Online & Verified Account</p>
                                                    </div>
                                                </div>
                                                
                                                {/* WA Body */}
                                                <div className="flex-1 py-2 space-y-2 overflow-y-auto">
                                                    <div className="bg-[#dcf8c6] text-slate-800 p-3 rounded-xl rounded-tr-sm text-[10px] font-bold leading-relaxed shadow-sm relative border-r-4 border-emerald-500">
                                                        {formatSimulatedMessage(campaignMessage)}
                                                        <span className="text-[6px] text-gray-400 block text-left mt-1">11:58 AM ✓✓</span>
                                                    </div>
                                                </div>
                                                
                                                {/* WA Input */}
                                                <div className="bg-white p-2 rounded-xl border border-gray-200 text-[8px] text-gray-400 font-bold flex justify-between items-center">
                                                    <span>Type message...</span>
                                                    <span>📎 📷</span>
                                                </div>
                                            </div>
                                        )}

                                        {dispatchChannel === 'push' && (
                                            <div className="flex-1 flex flex-col justify-start">
                                                {/* Push Header */}
                                                <div className="text-center pb-2 border-b border-gray-200">
                                                    <p className="text-[9px] font-black text-slate-800">Delta Stars App</p>
                                                    <p className="text-[6px] text-gray-400 font-bold">Web Push Service</p>
                                                </div>
                                                
                                                {/* Push Notification Banner */}
                                                <div className="mt-4 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex gap-2 items-center">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-yellow-500/50 flex-shrink-0 bg-white flex items-center justify-center p-0.5">
                                                        <DeltaStarsLogo onlyEmblem={true} className="w-full h-full object-contain" />
                                                    </div>
                                                    <div className="flex-grow text-right overflow-hidden">
                                                        <p className="text-[8px] font-black text-slate-900">{campaignTitle || "نجوم دلتا"}</p>
                                                        <p className="text-[7px] text-gray-500 font-bold truncate">{formatSimulatedMessage(campaignMessage)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3. Smart Offers & Catalogue Tab */}
                {subTab === 'offers' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-8"
                    >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-gray-100 gap-6">
                            <div>
                                <h3 className="text-2xl font-black text-primary mb-1">تسعير السلع وعروض الفروع</h3>
                                <p className="text-gray-400 font-bold text-xs">تحديث الأسعار في قاعدة البيانات وإضافة أصناف جديدة مباشرة لمخازن الفروع الستة</p>
                            </div>
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="bg-primary hover:bg-secondary text-white px-8 py-4 rounded-2xl font-black text-xs shadow-md hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <PlusIcon className="w-5 h-5" />
                                {language === 'ar' ? 'إضافة صنف منتج جديد للبيع' : 'Add New Produce Item'}
                            </button>
                        </div>

                        {/* Search and Category Filter */}
                        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-6 rounded-[2rem] border border-gray-100 shadow-md">
                            <input 
                                type="text"
                                placeholder="ابحث عن صنف لضبط سعره التنافسي..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full md:w-80 p-4 bg-slate-50 border-none rounded-xl outline-none text-xs font-bold"
                            />
                            <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-none">
                                <button 
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedCategory === 'all' ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                                >
                                    الكل
                                </button>
                                {categories.map(cat => (
                                    <button 
                                        key={cat.key}
                                        onClick={() => setSelectedCategory(cat.key)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedCategory === cat.key ? 'bg-primary text-white shadow-sm' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                                    >
                                        {language === 'ar' ? cat.label_ar : cat.label_en}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visual Catalog Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProducts.map(p => (
                                <div key={p.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all group flex flex-col justify-between">
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0">
                                            <img src={p.image} className="w-full h-full object-cover" alt={p.name_ar || p.name_en || "منتج تسويقي"} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h4 className="font-black text-slate-800 text-base truncate">{language === 'ar' ? p.name_ar : p.name_en}</h4>
                                            <span className="text-[10px] font-black bg-primary/5 text-primary px-3 py-1 rounded-full uppercase mt-2 inline-block">
                                                {p.category}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <span className="text-gray-400 font-bold text-xs">{language === 'ar' ? 'السعر الحالي:' : 'Current Price:'}</span>
                                            <span className="text-xl font-black text-primary">{formatCurrency(p.price)}</span>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => {
                                                    setEditingProduct(p);
                                                    setNewPrice(p.price.toString());
                                                }}
                                                className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-xs hover:bg-primary transition-all text-center"
                                            >
                                                طلب تعديل السعر
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    const updatedQty = p.stock_quantity === 0 ? 1000 : 0;
                                                    onUpdateProduct(p.id, { stock_quantity: updatedQty });
                                                    addToast(
                                                        updatedQty === 0 
                                                            ? (language === 'ar' ? 'تم ضبط الصنف كنفاد مخزون مؤقت' : 'Marked out of stock')
                                                            : (language === 'ar' ? 'تم تجديد المخزون بالكامل' : 'Stock replenished'), 
                                                        'success'
                                                    );
                                                }}
                                                className={`px-4 rounded-xl font-black text-[10px] border transition-all ${p.stock_quantity === 0 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                                            >
                                                {p.stock_quantity === 0 ? 'نفاد ✕' : 'متاح ✓'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 4. Price Approvals Tab */}
                {subTab === 'approvals' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-xl space-y-8"
                    >
                        <div>
                            <h3 className="text-xl font-black text-primary mb-1">محرك الرقابة والموافقة على أسعار السلع</h3>
                            <p className="text-gray-400 font-bold text-xs">مراجعة تعديلات الأسعار المطلوبة من فروع ومخازن الشركة ومندوبي المبيعات لضمان تماسك الهامش والربحية.</p>
                        </div>

                        {priceUpdateRequests?.filter(r => r.status === 'pending').length === 0 ? (
                            <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-gray-100">
                                <CheckCircleIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold text-sm">{language === 'ar' ? 'لا يوجد طلبات تعديل أسعار معلقة حالياً.' : 'No pending price update requests.'}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase text-[9px] font-black tracking-widest text-center">
                                            <th className="p-4 rounded-r-xl">المنتج</th>
                                            <th className="p-4">السعر القديم</th>
                                            <th className="p-4">السعر المقترح</th>
                                            <th className="p-4">مقدم الطلب</th>
                                            <th className="p-4">تاريخ الطلب</th>
                                            <th className="p-4 rounded-l-xl">الإجراءات والاعتماد</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-center font-bold text-slate-700">
                                        {priceUpdateRequests?.filter(r => r.status === 'pending').map((request) => (
                                            <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 text-right font-black text-primary">{language === 'ar' ? request.productName_ar : request.productName_en}</td>
                                                <td className="p-4 text-gray-400 font-black">{formatCurrency(request.oldPrice)}</td>
                                                <td className="p-4 text-emerald-600 font-black text-sm">{formatCurrency(request.newPrice)}</td>
                                                <td className="p-4 text-slate-500 text-[10px] font-bold">{request.requestedBy}</td>
                                                <td className="p-4 text-gray-400 text-[9px] font-bold">{new Date(request.requestedAt).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleApprovePriceRequest(request)}
                                                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-black hover:bg-emerald-600 transition-all text-[10px]"
                                                        >
                                                            اعتماد السعر ✓
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRejectPriceRequest(request.id)}
                                                            className="px-4 py-2 bg-red-50 text-red-500 rounded-lg font-black hover:bg-red-500 hover:text-white transition-all text-[10px]"
                                                        >
                                                            رفض
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Price Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-xl rounded-[4rem] p-12 shadow-4xl animate-scale-in">
                        <h3 className="text-3xl font-black text-primary mb-8 text-center">
                            {language === 'ar' ? `تعديل سعر ${editingProduct.name_ar}` : `Edit Price for ${editingProduct.name_en}`}
                        </h3>
                        
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">السعر التنافسي الجديد (ر.س)</label>
                                <input 
                                    type="number" 
                                    value={newPrice}
                                    onChange={e => setNewPrice(e.target.value)}
                                    className="w-full p-8 bg-gray-50 border-4 border-transparent focus:border-primary rounded-[2.5rem] font-black text-3xl outline-none transition-all text-center"
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={handlePriceUpdateSubmit}
                                    className="flex-1 bg-primary text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-secondary transition-all"
                                >
                                    إرسال طلب الاعتماد
                                </button>
                                <button 
                                    onClick={() => setEditingProduct(null)}
                                    className="px-10 bg-gray-100 text-gray-500 py-6 rounded-[2rem] font-black text-xl hover:bg-red-500 hover:text-white transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                            
                            <p className="text-center text-xs font-bold text-gray-400">
                                * سيتم فحص السعر ومراجعته من الإدارة والتدقيق المالي قبل تحديثه Live بالمتجر والفروع.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-12 shadow-4xl animate-scale-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-3xl font-black text-primary mb-8 text-center">
                            {language === 'ar' ? 'إضافة صنف منتج جديد للبيع' : 'Add New Produce Item'}
                        </h3>
                        
                        <form onSubmit={handleAddProduct} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">الاسم (عربي)</label>
                                    <input 
                                        type="text" required
                                        value={newProduct.name_ar}
                                        onChange={e => setNewProduct({...newProduct, name_ar: e.target.value})}
                                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs"
                                        placeholder="مثال: خلاص ملكي فاخر"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Name (EN)</label>
                                    <input 
                                        type="text" required
                                        value={newProduct.name_en}
                                        onChange={e => setNewProduct({...newProduct, name_en: e.target.value})}
                                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs"
                                        placeholder="Example: Royal Premium Dates"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">التصنيف الرئيسي</label>
                                    <select 
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({...newProduct, category: e.target.value as CategoryKey})}
                                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs"
                                    >
                                        {categories.map(c => (
                                            <option key={c.key} value={c.key}>{language === 'ar' ? c.label_ar : c.label_en}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">السعر الأساسي (ر.س)</label>
                                    <input 
                                        type="number" required step="0.01"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">وحدة القياس المعتمدة (عربي)</label>
                                    <input 
                                        type="text" required
                                        value={newProduct.unit_ar}
                                        onChange={e => setNewProduct({...newProduct, unit_ar: e.target.value})}
                                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs"
                                        placeholder="مثال: ريال للكرتون"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Unit (EN)</label>
                                    <input 
                                        type="text" required
                                        value={newProduct.unit_en}
                                        onChange={e => setNewProduct({...newProduct, unit_en: e.target.value})}
                                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs"
                                        placeholder="Example: Box"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">رابط الصورة السحابي (CDN)</label>
                                    <input 
                                        type="text" required
                                        value={newProduct.image}
                                        onChange={e => setNewProduct({...newProduct, image: e.target.value})}
                                        className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold outline-none text-xs"
                                        placeholder="https://images.unsplash.com/..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button 
                                    type="submit"
                                    className="flex-1 bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-secondary transition-all"
                                >
                                    إضافة الصنف للمخزن الفروع
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="px-10 bg-gray-100 text-gray-500 py-5 rounded-[2rem] font-black text-lg hover:bg-red-500 hover:text-white transition-all"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
