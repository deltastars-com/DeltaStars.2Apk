import React, { useState } from 'react';
import { TruckIcon, PlusIcon, SearchIcon, FilterIcon } from './lib/contexts/Icons';
import { useI18n } from './lib/contexts/I18nContext';

export default function ShipmentManagement() {
  const { t, language } = useI18n();
  const [shipments] = useState([
    { id: 'SH-7701', supplier_ar: 'مزارع القصيم', supplier_en: 'Qassim Farms', status: 'shipped', eta: '2024-04-10', items_ar: 'تمور، خضروات', items_en: 'Dates, Vegetables', tracking: 'TRK99201' },
    { id: 'SH-7702', supplier_ar: 'شركة النيل للاستيراد', supplier_en: 'Nile Import Co.', status: 'delivered', eta: '2024-04-08', items_ar: 'برتقال، ليمون', items_en: 'Oranges, Lemons', tracking: 'TRK99205' },
    { id: 'SH-7703', supplier_ar: 'مزارع الجوف', supplier_en: 'Al-Jouf Farms', status: 'pending', eta: '2024-04-12', items_ar: 'زيت زيتون، تمور', items_en: 'Olive Oil, Dates', tracking: 'TRK99210' },
  ]);

  return (
    <div className="space-y-8 animate-fade-in" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 gap-6">
        <div>
          <h2 className="text-3xl font-black text-primary mb-2">{t('admin.shipment.title')}</h2>
          <p className="text-gray-400 font-bold">{t('admin.shipment.subtitle')}</p>
        </div>
        <button className="bg-primary text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
          <PlusIcon className="w-6 h-6" /> {t('admin.shipment.add')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-2">{t('admin.shipment.active')}</p>
          <p className="text-4xl font-black text-primary">5</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-2">{t('admin.shipment.arrivingToday')}</p>
          <p className="text-4xl font-black text-secondary">2</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-2">{t('admin.shipment.totalSuppliers')}</p>
          <p className="text-4xl font-black text-slate-800">18</p>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <h3 className="text-xl font-black text-slate-800">{t('admin.shipment.listTitle')}</h3>
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder={t('admin.shipment.searchPlaceholder')} 
                className={`w-full ${language === 'ar' ? 'pl-12 pr-6' : 'pr-12 pl-6'} py-3 bg-gray-50 rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary/20`} 
              />
              <SearchIcon className={`w-5 h-5 absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-300`} />
            </div>
            <button className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-primary transition-all">
              <FilterIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">{t('admin.shipment.headers.id')}</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">{t('admin.shipment.headers.supplier')}</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">{t('admin.shipment.headers.items')}</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">{t('admin.shipment.headers.eta')}</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">{t('admin.shipment.headers.status')}</th>
                <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">{t('admin.shipment.headers.tracking')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shipments.map(shipment => (
                <tr key={shipment.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6 font-black text-primary">{shipment.id}</td>
                  <td className="px-8 py-6 font-bold text-slate-700">
                    {language === 'ar' ? shipment.supplier_ar : shipment.supplier_en}
                  </td>
                  <td className="px-8 py-6 text-sm text-gray-500 font-bold">
                    {language === 'ar' ? shipment.items_ar : shipment.items_en}
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-600 font-black">{shipment.eta}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${
                      shipment.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' : 
                      shipment.status === 'shipped' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {t(`common.statuses.${shipment.status}`)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-400 group-hover:text-primary transition-all cursor-pointer">
                      <TruckIcon className="w-4 h-4" />
                      {shipment.tracking}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
