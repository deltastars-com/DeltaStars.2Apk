import React from 'react';
import { ProductUnit } from '../types';
import { useI18n } from './lib/contexts/I18nContext';

export function UnitsPage({ units }: { units: ProductUnit[] }) {
    const { t, language } = useI18n();

    return (
        <div className="pt-32 pb-20 bg-slate-50 min-h-screen">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                    <h1 className="text-6xl md:text-8xl font-black text-primary uppercase tracking-tighter mb-6">
                        {language === 'ar' ? 'وحدات القياس' : 'Measurement Units'}
                    </h1>
                    <p className="text-2xl text-gray-400 font-bold italic">
                        {language === 'ar' ? 'دليل وحدات التوريد المعتمدة لدينا' : 'Our official supply measurement guide'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {units.map((unit) => (
                        <div key={unit.code} className="bg-white p-10 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-secondary transition-all group">
                            <div className="flex justify-between items-start mb-8">
                                <div className="bg-primary/5 p-4 rounded-2xl text-primary font-black text-xs uppercase tracking-widest">
                                    {unit.code}
                                </div>
                                <div className="text-secondary font-black text-4xl">
                                    {unit.base_factor}x
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-primary mb-4">
                                {language === 'ar' ? unit.name_ar : unit.name_en}
                            </h3>
                            <div className="h-1.5 w-12 bg-gray-100 group-hover:w-24 group-hover:bg-secondary transition-all rounded-full"></div>
                        </div>
                    ))}
                </div>

                {units.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[4rem] shadow-xl border-2 border-dashed border-gray-200">
                        <p className="text-2xl font-bold text-gray-400 uppercase tracking-widest">
                            {language === 'ar' ? 'لا توجد وحدات مسجلة حالياً' : 'No units registered yet'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
