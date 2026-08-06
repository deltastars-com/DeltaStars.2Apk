import React, { useState, useMemo } from 'react';
import { HomeSection, HomeSectionType } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, SparklesIcon, LayoutIcon, XIcon, SaveIcon, EyeIcon } from './lib/contexts/Icons';
import { useI18n, useFirebase } from './lib/contexts';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeSectionManagementSectionProps {
    homeSections?: HomeSection[];
    handleSaveSection?: (section: HomeSection) => void;
    handleDeleteSection?: (id: string) => void;
}

export const HomeSectionManagementSection: React.FC<HomeSectionManagementSectionProps> = ({ 
    homeSections: propHomeSections, handleSaveSection, handleDeleteSection 
}) => {
    const { language } = useI18n();
    const { products, ads, homeSections: contextHomeSections, updateHomeSection, addHomeSection, deleteHomeSection } = useFirebase();
    const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newSection, setNewSection] = useState<Partial<HomeSection>>({
        title_ar: '', title_en: '', type: 'featured', order: 10, isVisible: true, items: []
    });

    const activeSection = useMemo(() => editingSection || (isAdding ? newSection : null), [editingSection, isAdding, newSection]);
    const sectionsToUse = propHomeSections || contextHomeSections || [];

    const handleSave = async () => {
        if (editingSection) {
            if (handleSaveSection) {
                handleSaveSection(editingSection);
            } else {
                await updateHomeSection(editingSection.id, editingSection);
            }
            setEditingSection(null);
        } else if (isAdding) {
            if (handleSaveSection) {
                handleSaveSection(newSection as HomeSection);
            } else {
                await addHomeSection(newSection as Omit<HomeSection, 'id'>);
            }
            setIsAdding(false);
            setNewSection({ title_ar: '', title_en: '', type: 'featured', order: 10, isVisible: true, items: [] });
        }
    };

    const handleDelete = async (id: string) => {
        if (handleDeleteSection) {
            handleDeleteSection(id);
        } else {
            await deleteHomeSection(id);
        }
    };

    const renderPreview = (section: Partial<HomeSection>) => {
        const title = language === 'ar' ? (section.title_ar || 'بدون عنوان') : (section.title_en || 'Untitled');
        
        switch (section.type) {
            case 'hero':
                return (
                    <div className="bg-slate-900 aspect-video rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8 text-center relative border-4 border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-black/60 pointer-events-none"></div>
                        <h2 className="text-4xl font-black text-white mb-4 z-10">{title}</h2>
                        <div className="flex gap-4 z-10">
                            <div className="px-6 py-2 bg-secondary text-primary rounded-full font-black text-sm">Action 1</div>
                            <div className="px-6 py-2 bg-white/10 text-white rounded-full font-black text-sm">Action 2</div>
                        </div>
                    </div>
                );
            case 'categories':
                return (
                    <div className="bg-slate-50 aspect-video rounded-3xl p-8 border-4 border-white">
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-black text-primary">{title}</h3>
                            <div className="w-12 h-1 bg-secondary mx-auto mt-2 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="aspect-square bg-white rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-2">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg mb-2"></div>
                                    <div className="w-10 h-2 bg-slate-100 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'featured_products':
                return (
                    <div className="bg-white aspect-video rounded-3xl p-8 border-4 border-slate-100 flex flex-col">
                        <h3 className="text-2xl font-black text-slate-800 mb-6">{title}</h3>
                        <div className="grid grid-cols-3 gap-4 flex-1">
                            {products.slice(0, 3).map(p => (
                                <div key={p.id} className="bg-slate-50 rounded-2xl border border-slate-100 p-3">
                                    <img src={p.image} className="w-full h-20 object-cover rounded-xl mb-2" alt={p.name_ar || p.name_en || "صورة كرت المنتج"} />
                                    <div className="w-full h-3 bg-slate-200 rounded-full mb-1"></div>
                                    <div className="w-1/2 h-3 bg-secondary/30 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'banner':
                return (
                    <div className="bg-secondary aspect-[21/9] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <h3 className="text-4xl font-black text-primary text-center">{title}</h3>
                        <p className="text-primary font-bold opacity-60">Flash Sale - 50% Off</p>
                    </div>
                );
            case 'stats':
                return (
                    <div className="bg-slate-900 aspect-video rounded-3xl p-8 flex flex-col items-center justify-center">
                        <div className="grid grid-cols-3 gap-8 w-full">
                            {[
                                { val: '150k+', label: 'Customers' },
                                { val: '99%', label: 'Happy' },
                                { val: '24/7', label: 'Support' }
                            ].map((s, i) => (
                                <div key={i} className="text-center">
                                    <div className="text-3xl font-black text-white">{s.val}</div>
                                    <div className="text-[10px] text-secondary font-black uppercase tracking-widest">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'ads':
                return (
                    <div className="bg-slate-100 aspect-video rounded-3xl p-6 relative overflow-hidden">
                        <div className="flex gap-4 w-[200%] h-full">
                            {ads.slice(0, 3).map(ad => (
                                <div key={ad.id} className="w-full h-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden relative">
                                    <img src={ad.image} className="w-full h-full object-cover" alt={ad.title_ar || "إعلان ترويجي"} />
                                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                        <div className="text-white font-black text-sm">Ad Slot Preview</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="bg-slate-50 aspect-video rounded-3xl p-8 border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                        <LayoutIcon className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-black uppercase tracking-widest text-sm">{section?.type} Section Preview</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sovereign border-8 border-slate-50 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-primary tracking-tighter uppercase flex items-center gap-4">
                        <LayoutIcon className="w-10 h-10 text-secondary" />
                        أقسام الواجهة الرئيسية
                    </h2>
                    <p className="text-gray-400 font-bold text-sm tracking-widest mt-1 uppercase">Landing Page Modular Engine</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full md:w-auto bg-primary text-white px-10 py-5 rounded-3xl font-black text-xl hover:bg-green-800 transition-all shadow-xl flex items-center justify-center gap-4 group"
                >
                    <PlusIcon className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                    إضافة قسم سيادي جديد
                </button>
            </div>

            {/* Sections List */}
            <div className="grid grid-cols-1 gap-8">
                {[...sectionsToUse].sort((a, b) => a.order - b.order).map(section => (
                    <div key={section.id} className="bg-white p-8 rounded-[3rem] shadow-sovereign border-4 border-white flex flex-col md:flex-row justify-between items-center gap-8 group hover:border-primary transition-all">
                        <div className="flex items-center gap-8">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-gray-100 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                <LayoutIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800">{language === 'ar' ? section.title_ar : section.title_en}</h3>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                    <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-400 font-black uppercase tracking-widest border border-slate-200">{section.type}</span>
                                    <span className="text-[10px] bg-secondary/20 px-3 py-1 rounded-full text-primary font-black uppercase tracking-widest border border-secondary/20">Order: {section.order}</span>
                                    {!section.isVisible && <span className="text-[10px] bg-red-100 px-3 py-1 rounded-full text-red-600 font-black uppercase tracking-widest flex items-center gap-1"><XIcon className="w-3 h-3" /> Hidden</span>}
                                    {section.isVisible && <span className="text-[10px] bg-green-100 px-3 py-1 rounded-full text-green-600 font-black uppercase tracking-widest flex items-center gap-1"><EyeIcon className="w-3 h-3" /> Active</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setEditingSection(section)}
                                className="p-4 bg-slate-50 rounded-2xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95"
                            >
                                <PencilIcon className="w-6 h-6" />
                            </button>
                            <button 
                                onClick={() => { if(confirm('متأكد؟')) handleDelete(section.id); }}
                                className="p-4 bg-slate-50 rounded-2xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95"
                            >
                                <TrashIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit Modal with LIVE PREVIEW */}
            <AnimatePresence>
                {(isAdding || editingSection) && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-3xl overflow-y-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 50 }}
                            className="bg-white w-full max-w-7xl rounded-[4rem] shadow-sovereign overflow-hidden flex flex-col lg:flex-row h-full max-h-[90vh]"
                        >
                            {/* Editor Pane */}
                            <div className="flex-1 p-10 md:p-14 space-y-10 overflow-y-auto custom-scrollbar border-l-2 border-slate-50">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase">
                                            {editingSection ? 'تعديل القسم' : 'قسم سيادي جديد'}
                                        </h2>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Configure section properties</p>
                                    </div>
                                    <button 
                                        onClick={() => { setIsAdding(false); setEditingSection(null); }}
                                        className="p-4 bg-slate-100 rounded-full hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <XIcon className="w-8 h-8" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">العنوان (بالعربية)</label>
                                        <input 
                                            type="text" 
                                            placeholder="مثلاً: الخضراوات الطازجة"
                                            value={activeSection?.title_ar || ''}
                                            onChange={e => editingSection ? setEditingSection({...editingSection, title_ar: e.target.value}) : setNewSection({...newSection, title_ar: e.target.value})}
                                            className="w-full p-6 bg-slate-50 rounded-[2rem] border-4 border-transparent focus:border-primary outline-none font-black text-xl transition-all shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Section Title (EN)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Fresh Vegetables"
                                            value={activeSection?.title_en || ''}
                                            onChange={e => editingSection ? setEditingSection({...editingSection, title_en: e.target.value}) : setNewSection({...newSection, title_en: e.target.value})}
                                            className="w-full p-6 bg-slate-50 rounded-[2rem] border-4 border-transparent focus:border-primary outline-none font-black text-xl transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">نوع القسم</label>
                                        <div className="relative">
                                            <select 
                                                value={activeSection?.type}
                                                onChange={e => {
                                                    const val = e.target.value as HomeSectionType;
                                                    editingSection ? setEditingSection({...editingSection, type: val}) : setNewSection({...newSection, type: val});
                                                }}
                                                className="w-full p-6 bg-slate-50 rounded-[2rem] border-4 border-transparent focus:border-primary outline-none font-black text-xl transition-all appearance-none shadow-inner"
                                            >
                                                <option value="hero">Hero Section (البداية)</option>
                                                <option value="categories">Categories Grid (الأصناف)</option>
                                                <option value="featured_products">Featured Grid (منتجات مختارة)</option>
                                                <option value="banner">Promotional Banner (بانر ترويجي)</option>
                                                <option value="ads">Ads Slider (إعلانات متحركة)</option>
                                                <option value="stats">Stats Counter (إحصائيات)</option>
                                                <option value="channels">Channels (قنوات التواصل)</option>
                                                <option value="partners">Partners (شركاؤنا)</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <LayoutIcon className="w-6 h-6 text-primary" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">ترتيب العرض</label>
                                        <input 
                                            type="number" 
                                            value={activeSection?.order || 0}
                                            onChange={e => editingSection ? setEditingSection({...editingSection, order: parseInt(e.target.value)}) : setNewSection({...newSection, order: parseInt(e.target.value)})}
                                            className="w-full p-6 bg-slate-50 rounded-[2rem] border-4 border-transparent focus:border-primary outline-none font-black text-xl transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 group">
                                    <div className="relative inline-block w-16 h-8 transition duration-200 ease-in-out">
                                        <input 
                                            type="checkbox" 
                                            checked={activeSection?.isVisible}
                                            onChange={e => editingSection ? setEditingSection({...editingSection, isVisible: e.target.checked}) : setNewSection({...newSection, isVisible: e.target.checked})}
                                            className="opacity-0 w-0 h-0 peer"
                                            id="visibility-toggle"
                                        />
                                        <label htmlFor="visibility-toggle" className="absolute top-0 left-0 right-0 bottom-0 bg-slate-200 rounded-full cursor-pointer transition-all peer-checked:bg-primary before:content-[''] before:absolute before:left-1 before:bottom-1 before:bg-white before:w-6 before:h-6 before:rounded-full before:transition-all peer-checked:before:translate-x-8 shadow-inner"></label>
                                    </div>
                                    <label htmlFor="visibility-toggle" className="font-black text-slate-800 uppercase tracking-widest text-sm cursor-pointer select-none">القسم نشط وتتم معاينته</label>
                                </div>

                                <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                                    <button 
                                        onClick={handleSave}
                                        className="flex-1 bg-primary text-white py-6 md:py-8 rounded-[2.5rem] font-black text-2xl hover:bg-green-800 transition-all shadow-sovereign flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95"
                                    >
                                        <SaveIcon className="w-8 h-8" />
                                        Save & Publish
                                    </button>
                                </div>
                            </div>

                            {/* Preview Pane */}
                            <div className="w-full lg:w-[450px] bg-slate-50 p-10 md:p-14 flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <h4 className="text-2xl font-black text-primary uppercase tracking-tighter flex items-center gap-3">
                                        <EyeIcon className="w-6 h-6 text-secondary" />
                                        المعاينة المباشرة
                                    </h4>
                                    <span className="px-3 py-1 bg-secondary/10 text-primary font-black text-[10px] rounded-full uppercase tracking-widest border border-secondary/20">Live Sync</span>
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-10">
                                    <div className="bg-white p-4 rounded-[4rem] shadow-sovereign border-8 border-white ring-2 ring-slate-100 overflow-hidden transform hover:scale-[1.05] transition-all duration-700">
                                        <div className="bg-slate-50 rounded-[3rem] overflow-hidden p-2">
                                            {activeSection && renderPreview(activeSection)}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 px-6 py-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                                            <SparklesIcon className="w-6 h-6 text-emerald-600" />
                                            <p className="text-xs font-bold text-emerald-700 leading-tight">هذه المعاينة توضح تمثيل القسم داخل التطبيق بشكل ديناميكي بناءً على تعديلاتك الحالية.</p>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Preview subject to actual scale and platform</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
