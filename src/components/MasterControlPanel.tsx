import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ActivityIcon, ShieldCheckIcon, TruckIcon, 
  DatabaseIcon, WalletIcon, BellIcon, 
  RefreshCcwIcon, ZapIcon 
} from './lib/contexts/Icons';
import { useI18n, useFirebase, useToast } from '../components/lib/contexts';
import { 
  AlertTriangle, Leaf, Sliders, RefreshCw, 
  Send, Plus, Terminal, HeartPulse, Sparkles, Zap, Power
} from 'lucide-react';

import { OrderAnalyticsCharts } from './OrderAnalyticsCharts';

interface SystemStatus {
  id: string;
  name_ar: string;
  name_en: string;
  status: 'online' | 'warning' | 'offline';
  load: number;
  icon: React.ReactNode;
}

// Synthesized audio engine using native browser AudioContext
const playSovereignChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // First Chime (Warm Gold Tone)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.5);

    // Second Chime (Higher Emerald Tone) after 140ms
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.7);
    }, 140);
  } catch (e) {
    console.log('Audio Context bypassed.');
  }
};

const playAlertChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    console.log('Audio Context bypassed.');
  }
};

export const MasterControlPanel: React.FC = () => {
    const { language, formatCurrency } = useI18n();
    const { products, ads, orders, updateProduct } = useFirebase();
    const { addToast } = useToast();

    const [autoReplenish, setAutoReplenish] = React.useState(false);
    const [logs, setLogs] = React.useState<string[]>([]);
    const [isSimulating, setIsSimulating] = React.useState(false);

    // Filter fresh produce products: fruits, vegetables, herbs, seasonal
    const freshProduceCategories = ['fruits', 'vegetables', 'herbs', 'seasonal'];
    const freshProducts = React.useMemo(() => {
        return products.filter(p => freshProduceCategories.includes(p.category));
    }, [products]);

    // Live items to display in the alert console
    const alertsToDisplay = React.useMemo(() => {
        const lowStock = freshProducts.filter(p => (p.stock_quantity ?? 0) <= (p.min_threshold ?? 15));
        if (lowStock.length > 0) {
            return lowStock.slice(0, 4);
        }
        // Fallback: show lowest stock fresh produce items as warnings to avoid blank dashboard
        return [...freshProducts]
            .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0))
            .slice(0, 4);
    }, [freshProducts]);

    // Dynamic metrics calculation
    const criticalCount = React.useMemo(() => {
        return freshProducts.filter(p => (p.stock_quantity ?? 0) <= 10).length;
    }, [freshProducts]);

    const warningCount = React.useMemo(() => {
        return freshProducts.filter(p => {
            const stock = p.stock_quantity ?? 0;
            return stock > 10 && stock <= (p.min_threshold ?? 15);
        }).length;
    }, [freshProducts]);

    // Intelligent Auto-Replenishment Scheduler Loop
    React.useEffect(() => {
        if (!autoReplenish) return;

        const interval = setInterval(async () => {
            const lowStockProduce = freshProducts.filter(p => (p.stock_quantity ?? 0) <= (p.min_threshold ?? 15));
            
            if (lowStockProduce.length > 0) {
                const target = lowStockProduce[0];
                const newStock = (target.stock_quantity ?? 0) + 80;
                
                try {
                    await updateProduct(target.id, { stock_quantity: newStock });
                    playSovereignChime();
                    addToast(
                        language === 'ar'
                            ? `الأتمتة السيادية: تم إعادة شحن تلقائية لـ ${target.name_ar} بمقدار +80 وحدة`
                            : `Sovereign Auto-Replenish: Automatically restocked ${target.name_en} with +80 units`,
                        'success'
                    );
                    setLogs(prev => [
                        `[${new Date().toLocaleTimeString()}] أتمتة: شحن تلقائي لـ ${target.name_ar} (+80 وحدة)`,
                        ...prev.slice(0, 14)
                    ]);
                } catch (err) {
                    console.error('Auto replenishment failed', err);
                }
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [autoReplenish, freshProducts, updateProduct, language, addToast]);

    // Simulate Rapid Consumption Deficit (mock drop)
    const handleSimulateDeficit = async () => {
        if (freshProducts.length === 0) {
            addToast(
                language === 'ar' ? 'لا يوجد منتجات طازجة حالياً في النظام للمحاكاة!' : 'No fresh products in the system to simulate!',
                'warning'
            );
            return;
        }

        setIsSimulating(true);
        // Select up to 2 random fresh produce items to drain
        const randomItems = [...freshProducts].sort(() => 0.5 - Math.random()).slice(0, 2);
        
        try {
            for (const item of randomItems) {
                const criticalStock = Math.floor(Math.random() * 8) + 2; // Stock of 2 to 9
                await updateProduct(item.id, { stock_quantity: criticalStock });
            }
            playAlertChime();
            addToast(
                language === 'ar' ? 'تمت محاكاة استهلاك عاجل وهبوط مستويات المخزون الطازج!' : 'Simulated rapid fresh produce consumption and stock drain!',
                'warning'
            );
            setLogs(prev => [
                `[${new Date().toLocaleTimeString()}] رادار الاستهلاك: هبوط مخزون ${randomItems.map(i => language === 'ar' ? i.name_ar : i.name_en).join(' و ')} تحت حد التحذير الطارئ.`,
                ...prev.slice(0, 14)
            ]);
        } catch (err) {
            console.error('Deficit simulation failed', err);
        } finally {
            setIsSimulating(false);
        }
    };

    // Manual Emergency Restock override
    const handleEmergencyRestock = async (productId: number, currentStock: number) => {
        const target = products.find(p => p.id === productId);
        if (!target) return;
        const addedStock = 100;
        const newStock = currentStock + addedStock;

        try {
            await updateProduct(productId, { stock_quantity: newStock });
            playSovereignChime();
            addToast(
                language === 'ar' ? `تم تغذية ${target.name_ar} بـ +100 وحدة بنجاح` : `Successfully refilled ${target.name_en} with +100 units`,
                'success'
            );
            setLogs(prev => [
                `[${new Date().toLocaleTimeString()}] تدخل عاجل: تغذية مخزون ${target.name_ar} يدوياً بمقدار +100 وحدة`,
                ...prev.slice(0, 14)
            ]);
        } catch (err) {
            addToast(language === 'ar' ? 'فشل تحديث المخزون الطارئ' : 'Emergency stock update failed', 'error');
        }
    };

    // Notify Supplier (encapsulated workflow)
    const handleNotifySupplier = (productName: string) => {
        playSovereignChime();
        addToast(
            language === 'ar' 
                ? `تم إرسال أمر توريد رقمي مشفر لمزارع القصيم المعتمدة لتوريد ${productName}`
                : `Sent secure digital supply order to accredited farms for ${productName}`,
            'info'
        );
        setLogs(prev => [
            `[${new Date().toLocaleTimeString()}] إرسال: أمر توريد ذكي صادر لـ ${productName} (الشركاء المحليون)`,
            ...prev.slice(0, 14)
        ]);
    };

    const systems: SystemStatus[] = [
        { id: 'auth', name_ar: 'نظام الهوية والاستحقاق', name_en: 'Identity & Auth', status: 'online', load: 12, icon: <ShieldCheckIcon className="w-6 h-6" /> },
        { id: 'db', name_ar: 'قاعدة البيانات السيادية', name_en: 'Sovereign Database', status: 'online', load: 34, icon: <DatabaseIcon className="w-6 h-6" /> },
        { id: 'logistics', name_ar: 'نظام التتبع اللوجستي', name_en: 'Logistics Tracking', status: 'online', load: 56, icon: <TruckIcon className="w-6 h-6" /> },
        { id: 'finance', name_ar: 'التكامل المالي (Onyx)', name_en: 'Financial Integration', status: 'online', load: 5, icon: <WalletIcon className="w-6 h-6" /> },
        { id: 'notif', name_ar: 'محرك الإشعارات الذكي', name_en: 'Smart Notification Engine', status: 'online', load: 89, icon: <BellIcon className="w-6 h-6 animate-pulse text-amber-400" /> },
        { id: 'ai', name_ar: 'مساعد الذكاء الاصطناعي', name_en: 'AI Core Assistant', status: 'online', load: 22, icon: <ZapIcon className="w-6 h-6 text-secondary" /> }
    ];

    return (
        <div className="space-y-8 animate-fade-in text-right">
            {/* Real-time System Core Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systems.map((sys, idx) => (
                    <motion.div 
                        key={sys.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white p-8 rounded-[3rem] shadow-sovereign border border-slate-50 relative overflow-hidden group hover:scale-[1.01] transition-all"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                {sys.icon}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full animate-pulse ${sys.status === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sys.status}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xl font-black text-slate-800">{language === 'ar' ? sys.name_ar : sys.name_en}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Automation Priority: High</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase">
                                    <span>System Load</span>
                                    <span>{sys.load}%</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${sys.load}%` }}
                                        className={`h-full ${sys.load > 80 ? 'bg-red-500' : 'bg-primary'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recharts Graphical Order & Revenue Analytics */}
            <OrderAnalyticsCharts orders={orders || []} language={language as 'ar' | 'en'} />

            {/* Automated Fresh Produce Low-Stock Alerts Section */}
            <div className="bg-white p-8 md:p-12 rounded-[4rem] shadow-xl border-2 border-slate-100 overflow-hidden relative">
                {/* Header Block with smart settings */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 pb-8 border-b border-slate-100">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-rose-500">
                            <AlertTriangle className="w-6 h-6 animate-bounce" />
                            <span className="text-xs font-black uppercase tracking-widest bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-100">
                                {language === 'ar' ? 'مراقبة وإشعار فوري' : 'Live Stock Telemetry'}
                            </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900">
                            {language === 'ar' ? 'تنبيهات عجز مخزون المحاصيل الطازجة' : 'Fresh Produce Deficit Warnings'} 🌿
                        </h3>
                        <p className="text-slate-500 font-bold text-xs">
                            {language === 'ar'
                                ? 'رادار ذكي لمراقبة مستويات المنتجات سريعة التلف وعالية الطلب (الخضروات، الفواكه والتمور) وتغذيتها تلقائياً.'
                                : 'Automated monitoring of rapid-depletion high-demand organic stock with automatic replenishment routing.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Status indicators */}
                        <div className="flex gap-2">
                            <span className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-black flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                {language === 'ar' ? `عجز حرِج (${criticalCount})` : `Critical (${criticalCount})`}
                            </span>
                            <span className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl text-xs font-black flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                {language === 'ar' ? `تحت الحد المسموح (${warningCount})` : `Warning (${warningCount})`}
                            </span>
                        </div>

                        {/* Interactive triggers */}
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner">
                            {/* Auto Replenish toggle switch */}
                            <button
                                onClick={() => {
                                    setAutoReplenish(!autoReplenish);
                                    playSovereignChime();
                                }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                                    autoReplenish 
                                        ? 'bg-emerald-600 text-white shadow-lg' 
                                        : 'bg-white hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                <Power className="w-4 h-4" />
                                <span>{autoReplenish ? (language === 'ar' ? 'الأتمتة نشطة' : 'Auto Replenish ON') : (language === 'ar' ? 'تفعيل الأتمتة' : 'Enable Auto-Replenish')}</span>
                            </button>

                            {/* Simulation button */}
                            <button
                                onClick={handleSimulateDeficit}
                                disabled={isSimulating}
                                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                                <span>{language === 'ar' ? 'محاكاة عجز طارئ' : 'Simulate Deficit'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subgrid: Alerts listing & Live Telemetry terminal */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Alerts display (2/3 width) */}
                    <div className="xl:col-span-2 space-y-4">
                        {alertsToDisplay.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <Leaf className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-700 font-black text-lg">{language === 'ar' ? 'جميع مستويات مخزون المحاصيل الطازجة ممتازة ووفيرة' : 'All fresh produce inventory levels are healthy and abundant!'}</p>
                                <p className="text-xs text-slate-400 mt-1">{language === 'ar' ? 'انقر على "محاكاة عجز طارئ" للتحقق من نظام التحذيرات.' : 'Click "Simulate Deficit" to check the warning thresholds.'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {alertsToDisplay.map((p) => {
                                        const stock = p.stock_quantity ?? 0;
                                        const threshold = p.min_threshold ?? 15;
                                        const isCritical = stock <= 10;
                                        const percentage = Math.min(100, Math.round((stock / 60) * 100));

                                        return (
                                            <motion.div
                                                key={p.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`p-6 rounded-[2.5rem] border-2 transition-all relative overflow-hidden bg-white shadow-md hover:shadow-lg ${
                                                    isCritical 
                                                        ? 'border-rose-100 bg-gradient-to-br from-white to-rose-50/20' 
                                                        : 'border-amber-100 bg-gradient-to-br from-white to-amber-50/20'
                                                }`}
                                            >
                                                {/* Left status accent strip */}
                                                <div className={`absolute top-0 right-0 w-2 h-full ${isCritical ? 'bg-rose-500' : 'bg-amber-400'}`} />

                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="space-y-1">
                                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block ${
                                                            isCritical ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                                                        }`}>
                                                            {isCritical ? (language === 'ar' ? 'عجز طارئ' : 'Critical Depletion') : (language === 'ar' ? 'تحذير النقص' : 'Low Inventory')}
                                                        </span>
                                                        <h4 className="text-lg font-black text-slate-800 mt-1">
                                                            {language === 'ar' ? p.name_ar : p.name_en}
                                                        </h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SKU: {p.sku || `DS-PROD-${p.id}`}</p>
                                                    </div>
                                                    <div className="text-left font-mono">
                                                        <span className={`text-2xl font-black ${isCritical ? 'text-rose-600' : 'text-amber-500'}`}>{stock}</span>
                                                        <span className="text-xs text-slate-400 font-bold"> / 60 {p.unit_ar || 'كجم'}</span>
                                                    </div>
                                                </div>

                                                {/* Progress indicator */}
                                                <div className="space-y-1 mb-6">
                                                    <div className="flex justify-between text-[10px] font-black text-slate-500">
                                                        <span>{language === 'ar' ? 'سعة المخزن الحالي:' : 'Current capacity:'}</span>
                                                        <span>{percentage}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Interaction action tray */}
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEmergencyRestock(p.id, stock)}
                                                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 shadow-md border-b-2 border-emerald-700"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                        <span>{language === 'ar' ? 'تغذية (+100)' : 'Refill +100'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleNotifySupplier(language === 'ar' ? p.name_ar : p.name_en)}
                                                        className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center"
                                                        title={language === 'ar' ? 'طلب توريد طارئ' : 'Emergency supply dispatch'}
                                                    >
                                                        <Send className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Operation Telemetry Terminal (1/3 width) */}
                    <div className="xl:col-span-1 bg-slate-950 p-6 rounded-[2.5rem] border border-slate-800 text-right font-mono flex flex-col justify-between shadow-lg">
                        <div>
                            <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-800">
                                <h4 className="text-white text-xs font-black flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-emerald-400" />
                                    <span>{language === 'ar' ? 'تليمتري الأتمتة والعمليات' : 'Telemetry logs'}</span>
                                </h4>
                                <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
                            </div>

                            <div className="space-y-2 h-[190px] overflow-y-auto text-[10px] text-slate-400 scrollbar-thin scrollbar-thumb-slate-800">
                                {logs.length === 0 ? (
                                    <div className="text-center py-10 text-slate-600 font-bold">
                                        <p>{language === 'ar' ? 'بانتظار أحداث تشغيل النظام...' : 'Awaiting telemetry signals...'}</p>
                                    </div>
                                ) : (
                                    logs.map((log, lIdx) => (
                                        <p key={lIdx} className="leading-relaxed border-b border-slate-900/40 pb-1 text-emerald-400">
                                            {log}
                                        </p>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                            <span>{language === 'ar' ? 'الشبكة الأمنية:' : 'Network security:'} Encrypted</span>
                            <span className="flex items-center gap-1 text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {language === 'ar' ? 'متصل' : 'Connected'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sovereign Protocol Full Automation Banner */}
            <div className="bg-primary-dark p-10 md:p-14 rounded-[4rem] text-white overflow-hidden relative shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 text-right">
                        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full border border-white/10 shadow-lg">
                            <RefreshCcwIcon className="w-4 h-4 text-emerald-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Global Status: Synchronized</span>
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
                            {language === 'ar' ? 'الأتمتة الكاملة للنظام السيادي' : 'Sovereign Protocol Full Automation'}
                        </h3>
                        <p className="text-white/60 font-medium text-lg leading-relaxed max-w-2xl">
                            {language === 'ar' 
                                ? 'جميع الأنظمة الداخلية مرتبطة وتعمل بتكامل لحظي. يتم مراقبة حركة المبيعات، المخزون، والجودة عبر محرك الذكاء الاصطناعي "عدي" لضمان الكفاءة القصوى.'
                                : 'All internal systems are linked and operating with real-time integration. Sales, inventory, and quality are monitored via AI Core "Adi" to ensure maximum efficiency.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/10">
                            <div className="text-4xl font-black text-secondary">99.9%</div>
                            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">Uptime</div>
                        </div>
                        <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/10">
                            <div className="text-4xl font-black text-emerald-400">1.2s</div>
                            <div className="text-[10px] text-white/40 uppercase font-black tracking-widest mt-1">Dispatch</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
