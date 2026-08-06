import React, { useState, useEffect, useMemo } from 'react';
import { useI18n, useFirebase, useToast, DeliveryIcon, PlusIcon, TrashIcon, SparklesIcon, PencilIcon, ChartLineIcon, RadarIcon, FilterIcon, CalendarIcon, ShoppingBagIcon } from './lib/contexts';
import { DeliveryAgent, Order } from '../types';
import { LiveOrderConsole } from './LiveOrderConsole';
import { SaudiFlag } from './SaudiFlag';

const SweetMap = React.lazy(() => import('./SweetMap').then(module => ({ default: module.SweetMap })));

export const OperationsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { language } = useI18n();
    const { addToast } = useToast();
    const { deliveryAgents, updateDeliveryAgent, addDeliveryAgent, deleteDeliveryAgent, orders } = useFirebase();
    const [isSimulating, setIsSimulating] = useState(false);
    const [activeTab, setActiveTab] = useState<'radar' | 'performance' | 'live_control'>('radar');
    
    const [showAgentForm, setShowAgentForm] = useState(false);
    const [editingAgent, setEditingAgent] = useState<DeliveryAgent | null>(null);

    // Filter states for performance view
    const [dateRange, setDateRange] = useState({ 
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // Calculate aggregated stats for agents
    const agentStats = useMemo(() => {
        return deliveryAgents.map(agent => {
            const agentOrders = orders.filter(o => 
                o.driverId === agent.id && 
                o.createdAt >= dateRange.start && 
                o.createdAt <= dateRange.end + 'T23:59:59'
            );
            
            const completed = agentOrders.filter(o => o.status === 'delivered').length;
            const earnings = agentOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + (o.shippingFee || 0), 0);
            const averageRating = agent.rating || 5.0; // In real app, calculate from actual reviews

            return {
                ...agent,
                period_completed: completed,
                period_earnings: earnings,
                period_rating: averageRating
            };
        });
    }, [deliveryAgents, orders, dateRange]);

    // Map Center (Defaults to HQ or first agent)
    const [mapCenter, setMapCenter] = useState({ lat: 21.5424, lng: 39.2201 });

    // Simulation logic (Updated for react-google-maps compatibility if needed, but the current logic is fine)
    useEffect(() => {
        if (!isSimulating) return;

        const interval = setInterval(() => {
            deliveryAgents.forEach(agent => {
                if (agent.status === 'delivering' || agent.status === 'online') {
                    const newLat = agent.location.lat + (Math.random() - 0.5) * 0.0005;
                    const newLng = agent.location.lng + (Math.random() - 0.5) * 0.0005;
                    updateDeliveryAgent(agent.id, {
                        location: { lat: newLat, lng: newLng }
                    });
                }
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [isSimulating, deliveryAgents, updateDeliveryAgent]);

    const mapMarkers = deliveryAgents.map(agent => ({
        id: agent.id,
        position: { lat: agent.location.lat, lng: agent.location.lng },
        title: agent.name,
        description: `${agent.status} - ${agent.vehicle_type === 'truck' ? 'شاحنة تبريد' : 'سيارة توزيع'}`,
        // Enhanced marker icons
        icon: agent.status === 'online' ? 'https://maps.google.com/mapfiles/kml/paddle/grn-circle.png' : 
              agent.status === 'delivering' ? 'https://maps.google.com/mapfiles/kml/paddle/ylw-circle.png' : 
              'https://maps.google.com/mapfiles/kml/paddle/red-circle.png'
    }));

    const handleAddAgent = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const phone = formData.get('phone') as string;
        const vehicle = formData.get('vehicle') as any;

        const agentData: Omit<DeliveryAgent, 'id'> = {
            name, phone, vehicle_type: vehicle,
            status: 'online', rating: 5.0,
            completed_orders: editingAgent?.completed_orders || 0,
            earnings: editingAgent?.earnings || 0,
            location: editingAgent?.location || { lat: 21.5424 + (Math.random() - 0.5) * 0.01, lng: 39.2201 + (Math.random() - 0.5) * 0.01 }
        };

        if (editingAgent) {
            updateDeliveryAgent(editingAgent.id, agentData);
        } else {
            addDeliveryAgent(agentData);
        }

        addToast(language === 'ar' ? 'تم تحديث الأسطول بنجاح' : 'Fleet Updated Successfully', 'success');
        setShowAgentForm(false);
        setEditingAgent(null);
    };

    return (
        <div className="min-h-[85vh] bg-slate-950 text-white rounded-[4rem] p-6 flex flex-col gap-6 shadow-3xl border border-white/10 overflow-hidden relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-3xl p-6 rounded-[3rem] border border-white/10 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center border-2 border-secondary">
                        <DeliveryIcon className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Delta Fleet Radar</h2>
                        <p className="text-secondary font-bold text-[10px] tracking-widest">إدارة التتبع الجغرافي للأسطول</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white/10 p-1 rounded-2xl flex gap-1 mr-4">
                        <button 
                            onClick={() => setActiveTab('radar')}
                            className={`px-6 py-2 rounded-xl font-black transition-all flex items-center gap-2 ${activeTab === 'radar' ? 'bg-secondary text-white shadow-lg' : 'hover:bg-white/10'}`}
                        >
                            <RadarIcon className="w-4 h-4" /> رادار
                        </button>
                        <button 
                            onClick={() => setActiveTab('live_control')}
                            className={`px-6 py-2 rounded-xl font-black transition-all flex items-center gap-2 ${activeTab === 'live_control' ? 'bg-secondary text-white shadow-lg' : 'hover:bg-white/10'}`}
                        >
                            <ShoppingBagIcon className="w-4 h-4" /> كنترول {language === 'ar' ? 'الطلبات' : 'Orders'}
                        </button>
                        <button 
                            onClick={() => setActiveTab('performance')}
                            className={`px-6 py-2 rounded-xl font-black transition-all flex items-center gap-2 ${activeTab === 'performance' ? 'bg-secondary text-white shadow-lg' : 'hover:bg-white/10'}`}
                        >
                            <ChartLineIcon className="w-4 h-4" /> الأداء
                        </button>
                    </div>
                    <button 
                        onClick={() => setIsSimulating(!isSimulating)} 
                        className={`px-6 py-3 rounded-2xl font-black shadow-2xl transition-all flex items-center gap-3 ${isSimulating ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
                    >
                        <div className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-white animate-pulse' : 'bg-white/50'}`}></div>
                        {language === 'ar' ? (isSimulating ? 'إيقاف المحاكاة' : 'بدء المحاكاة') : (isSimulating ? 'Stop Simulation' : 'Start Simulation')}
                    </button>
                    <button onClick={() => setShowAgentForm(true)} className="bg-primary hover:bg-primary-light px-8 py-3 rounded-2xl font-black shadow-2xl transition-all flex items-center gap-3">
                        <PlusIcon className="w-5 h-5" /> إضافة مندوب
                    </button>
                    <button onClick={onBack} className="bg-white/10 px-6 py-3 rounded-2xl hover:bg-red-600 transition-all font-black shadow-lg">إغلاق</button>
                </div>
            </div>

            {activeTab === 'radar' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 relative z-10 h-full min-h-0">
                    <div className="lg:col-span-8 relative bg-gray-900 rounded-[3.5rem] border-4 border-white/5 overflow-hidden shadow-inner min-h-[500px]">
                        <React.Suspense fallback={<div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-white/50 font-black tracking-widest uppercase">يتم تحميل الرادار السيادي...</div>}>
                            <SweetMap 
                                markers={mapMarkers} 
                                center={mapCenter} 
                                zoom={13}
                            />
                        </React.Suspense>
                        {/* Floating Map Legend */}
                        <div className="absolute bottom-6 left-6 z-[400] bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest space-y-2">
                            <div className="flex items-center gap-3"><span className="w-3 h-3 bg-secondary rounded-full animate-pulse"></span> جاري التوصيل</div>
                            <div className="flex items-center gap-3"><span className="w-3 h-3 bg-green-500 rounded-full"></span> متصل / متاح</div>
                            <div className="flex items-center gap-3"><span className="w-3 h-3 bg-gray-500 rounded-full"></span> غير متصل</div>
                        </div>
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                        <div className="bg-white/5 backdrop-blur-xl rounded-[3.5rem] p-8 border border-white/10 flex-1 overflow-y-auto custom-scrollbar shadow-2xl">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-secondary">
                                <SparklesIcon className="w-6 h-6" /> حالة الأسطول النشط
                            </h3>
                            <div className="space-y-4">
                                {deliveryAgents.length === 0 ? (
                                    <div className="text-center py-12 opacity-20 italic">لا توجد مركبات نشطة حالياً</div>
                                ) : (
                                    deliveryAgents.map(agent => (
                                        <div key={agent.id} className="p-6 rounded-[2rem] bg-white/5 border border-transparent hover:border-secondary transition-all flex justify-between items-center group">
                                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setMapCenter({ lat: agent.location.lat, lng: agent.location.lng })}>
                                                <span className="text-4xl filter drop-shadow-lg">{agent.vehicle_type === 'truck' ? '🚛' : '🚗'}</span>
                                                <div>
                                                    <p className="font-black text-xl leading-none">{agent.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500 animate-pulse' : (agent.status === 'delivering' ? 'bg-secondary animate-pulse' : 'bg-gray-500')}`}></span>
                                                        <p className="text-[10px] opacity-40 font-mono tracking-widest uppercase">{agent.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setEditingAgent(agent);
                                                        setShowAgentForm(true);
                                                    }}
                                                    className="p-3 bg-white/10 text-white rounded-xl hover:bg-primary transition-all"
                                                >
                                                    <PencilIcon className="w-5 h-5"/>
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا المندوب؟' : 'Are you sure you want to delete this agent?')) {
                                                            deleteDeliveryAgent(agent.id);
                                                        }
                                                    }} 
                                                    className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                    title="حذف من الرادار"
                                                >
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'live_control' ? (
                <div className="flex-1 overflow-y-auto bg-white/5 rounded-[4rem] p-4 border border-white/10 animate-fade-in relative z-10">
                    <LiveOrderConsole />
                </div>
            ) : (
                <div className="flex-1 bg-white/5 backdrop-blur-xl rounded-[4rem] border border-white/10 p-8 overflow-y-auto custom-scrollbar animate-fade-in relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 bg-white/5 p-8 rounded-[3rem] border border-white/5">
                        <div>
                            <h3 className="text-3xl font-black mb-2 flex items-center gap-4">
                                <ChartLineIcon className="w-10 h-10 text-secondary" /> تقرير إنتاجية المناديب
                            </h3>
                            <p className="text-gray-400 font-bold">تحليل الأداء، العمولات، والتقييمات للفترة المحددة</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 bg-black/40 p-4 rounded-3xl border border-white/10">
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                                <CalendarIcon className="w-5 h-5 text-secondary" />
                                <input 
                                    type="date" 
                                    value={dateRange.start} 
                                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="bg-transparent border-none outline-none text-white font-black text-sm"
                                />
                                <span className="opacity-40">→</span>
                                <input 
                                    type="date" 
                                    value={dateRange.end} 
                                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="bg-transparent border-none outline-none text-white font-black text-sm"
                                />
                            </div>
                            <button className="bg-secondary text-white p-3 rounded-2xl hover:scale-110 transition-all">
                                <FilterIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {agentStats.length === 0 ? (
                            <div className="col-span-full py-20 text-center opacity-30 italic text-2xl font-black">لا توجد بيانات متاحة حالياً</div>
                        ) : (
                            agentStats.map(agent => (
                                <div key={agent.id} className="bg-white/5 border border-white/10 rounded-[3rem] p-8 hover:border-secondary transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-secondary/20 transition-all"></div>
                                    
                                    <div className="flex items-center gap-6 mb-8 relative z-10">
                                        <div className="w-20 h-20 bg-black/40 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-white/10">
                                            {agent.vehicle_type === 'truck' ? '🚛' : '🚗'}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black">{agent.name}</h4>
                                            <p className="text-secondary text-sm font-bold opacity-80">{agent.phone}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5 text-center">
                                            <p className="text-[10px] text-gray-500 font-black mb-1 uppercase tracking-tighter">الطلبات</p>
                                            <p className="text-xl font-black text-blue-400">{agent.period_completed}</p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5 text-center">
                                            <p className="text-[10px] text-gray-500 font-black mb-1 uppercase tracking-tighter">الأرباح</p>
                                            <p className="text-xl font-black text-emerald-400">{agent.period_earnings} <span className="text-[10px]">ر.س</span></p>
                                        </div>
                                        <div className="bg-black/20 p-4 rounded-3xl border border-white/5 text-center">
                                            <p className="text-[10px] text-gray-500 font-black mb-1 uppercase tracking-tighter">التقييم</p>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-xl font-black text-yellow-500">{agent.period_rating}</span>
                                                <span className="text-yellow-500 text-xs">★</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 relative z-10">
                                        <div className="flex justify-between items-center text-sm p-4 bg-white/5 rounded-2xl">
                                            <span className="opacity-40 font-bold">الحالة الحالية:</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${agent.status === 'online' ? 'bg-green-500 animate-pulse' : (agent.status === 'delivering' ? 'bg-secondary animate-pulse' : 'bg-gray-500')}`}></span>
                                                <span className="font-black uppercase text-[10px]">{agent.status}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-sm p-4 bg-white/5 rounded-2xl">
                                            <span className="opacity-40 font-bold">نوع المركبة:</span>
                                            <span className="font-black text-[10px] uppercase">{agent.vehicle_type === 'truck' ? 'Cold Storage Truck' : 'Fast Delivery Car'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                                        <button className="flex-1 bg-white/5 hover:bg-white/10 p-4 rounded-2xl font-black text-sm transition-all border border-white/5">تنزيل الفواتير</button>
                                        <button className="flex-1 bg-secondary/20 hover:bg-secondary text-white p-4 rounded-2xl font-black text-sm transition-all border border-secondary/30">تعديل البيانات</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {showAgentForm && (
                <div className="fixed inset-0 bg-slate-950/98 z-[1100] flex justify-center items-center p-4 backdrop-blur-4xl animate-fade-in">
                    <div className="bg-white p-12 rounded-[4rem] w-full max-w-xl relative border-t-[20px] border-primary text-black shadow-sovereign">
                        <button onClick={() => setShowAgentForm(false)} className="absolute top-8 end-10 text-4xl text-gray-200 hover:text-red-500 font-black transition-all">&times;</button>
                        <h3 className="text-3xl font-black uppercase text-slate-800 mb-2">تسجيل مركبة</h3>
                        <p className="text-gray-400 font-bold mb-8">إضافة وحدة توصيل جديدة لنظام التتبع الجغرافي</p>
                        <form onSubmit={handleAddAgent} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">اسم المندوب</label>
                                <input name="name" type="text" placeholder="مثال: فهد السبيعي" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-2xl focus:border-primary outline-none transition-all" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">رقم الاتصال</label>
                                <div className="relative">
                                    <input name="phone" type="tel" placeholder="05XXXXXXXX" className="w-full p-6 pr-28 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-2xl focus:border-primary outline-none transition-all" required />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
                                        <SaudiFlag className="w-6 h-4 rounded" />
                                        <span className="font-black text-sm text-primary">+966</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">نوع المركبة</label>
                                <select name="vehicle" className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-xl outline-none focus:border-primary transition-all">
                                    <option value="truck">شاحنة تبريد (Frozen/Chilled)</option>
                                    <option value="car">سيارة توزيع سريعة</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white py-6 rounded-2xl font-black text-3xl shadow-xl hover:scale-[1.02] transition-all border-b-8 border-primary-dark active:border-b-0 active:translate-y-2">
                                تنشيط الوحدة الآن
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};