import React, { useState } from 'react';
import { useI18n } from './lib/contexts/I18nContext';

export default function DeveloperManagement() {
  const { t, language } = useI18n();
  const [logs] = useState([
    { id: 1, action_ar: 'تحديث واجهة المستخدم', action_en: 'UI Update', user_ar: 'المطور الرئيسي', user_en: 'Lead Dev', time_ar: 'منذ 10 دقائق', time_en: '10m ago', status_ar: 'ناجح', status_en: 'Success' },
    { id: 2, action_ar: 'مزامنة قاعدة البيانات', action_en: 'DB Sync', user_ar: 'النظام الآلي', user_en: 'Auto System', time_ar: 'منذ ساعة', time_en: '1h ago', status_ar: 'ناجح', status_en: 'Success' },
    { id: 3, action_ar: 'فحص أمان دوري', action_en: 'Security Audit', user_ar: 'نظام الحماية', user_en: 'Shield System', time_ar: 'منذ 3 ساعات', time_en: '3h ago', status_ar: 'ناجح', status_en: 'Success' },
  ]);

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-primary-dark">{t('admin.dev.title')}</h3>
        <div className="flex gap-2">
          <button className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">
            {t('admin.dev.publish')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary-dark p-8 rounded-[3rem] text-white shadow-2xl">
          <h4 className="text-lg font-black mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            {t('admin.dev.sysStatus')}
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-white/60">{t('admin.dev.version')}</span>
              <span className="text-sm font-black">v2.4.0 (Stable)</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-white/60">{t('admin.dev.latency')}</span>
              <span className="text-sm font-black text-emerald-400">42ms</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-xs font-bold text-white/60">{t('admin.dev.serverStatus')}</span>
              <span className="text-sm font-black text-emerald-400">{t('admin.dev.online')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100">
          <h4 className="text-lg font-black text-primary-dark mb-6">{t('admin.dev.opsLog')}</h4>
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-black text-primary-dark">
                      {language === 'ar' ? log.action_ar : log.action_en}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {language === 'ar' ? log.user_ar : log.user_en} • {language === 'ar' ? log.time_ar : log.time_en}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  {language === 'ar' ? log.status_ar : log.status_en}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
        <h4 className="text-xl font-black text-primary-dark mb-8">{t('admin.dev.advancedTools')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-primary-dark hover:text-white transition-all group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
            <p className="text-xs font-black">{t('admin.dev.tools.deepSettings')}</p>
          </button>
          <button className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-primary-dark hover:text-white transition-all group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🛡️</div>
            <p className="text-xs font-black">{t('admin.dev.tools.firewall')}</p>
          </button>
          <button className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-primary-dark hover:text-white transition-all group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">💾</div>
            <p className="text-xs font-black">{t('admin.dev.tools.backup')}</p>
          </button>
          <button className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-primary-dark hover:text-white transition-all group">
            <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🧹</div>
            <p className="text-xs font-black">{t('admin.dev.tools.cache')}</p>
          </button>
        </div>
      </div>
    </div>
  );
}
