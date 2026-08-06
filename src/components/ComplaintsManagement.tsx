import React, { useState } from 'react';
import DelegatesManagement from './DelegatesManagement';

export default function ComplaintsManagement() {
  const [activeTab, setActiveTab] = useState<'delegates' | 'complaints'>('delegates');
  const [complaints, setComplaints] = useState([
    { id: 'C-101', customer: 'مطعم النخبة', type: 'تأخر توصيل', priority: 'عالية', status: 'قيد المعالجة', date: '2024-03-24' },
    { id: 'C-102', customer: 'فندق ماريوت', type: 'جودة المنتج', priority: 'عالية', status: 'جديد', date: '2024-03-24' },
    { id: 'C-103', customer: 'سوبر ماركت الراية', type: 'خطأ في الفاتورة', priority: 'متوسطة', status: 'محلولة', date: '2024-03-23' },
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 p-2 rounded-3xl max-w-md">
        <button
          onClick={() => setActiveTab('delegates')}
          className={`flex-1 py-3 px-6 rounded-2xl font-black text-xs transition-all ${
            activeTab === 'delegates' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-500 hover:bg-slate-200/50'
          }`}
        >
          🚚 إدارة المناديب والسائقين (بالوقت الفعلي)
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex-1 py-3 px-6 rounded-2xl font-black text-xs transition-all ${
            activeTab === 'complaints' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-slate-500 hover:bg-slate-200/50'
          }`}
        >
          ⚠️ الشكاوى والملاحظات
        </button>
      </div>

      {activeTab === 'delegates' ? (
        <DelegatesManagement />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-primary-dark">الشكاوى والملاحظات</h3>
            <div className="flex gap-2">
              <button className="bg-white text-primary-dark px-4 py-2 rounded-xl font-bold border border-gray-100 shadow-sm">
                فلترة
              </button>
              <button className="bg-primary-dark text-white px-6 py-2 rounded-xl font-bold hover:scale-105 transition-all shadow-lg">
                تقرير الشكاوى
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 font-black">!</div>
              <div>
                <p className="text-xs text-gray-400 font-bold">شكاوى عاجلة</p>
                <p className="text-xl font-black text-primary-dark">2</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 font-black">?</div>
              <div>
                <p className="text-xs text-gray-400 font-bold">قيد المعالجة</p>
                <p className="text-xl font-black text-primary-dark">5</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 font-black">✓</div>
              <div>
                <p className="text-xs text-gray-400 font-bold">تم حلها اليوم</p>
                <p className="text-xl font-black text-primary-dark">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h4 className="text-lg font-black text-primary-dark">قائمة الشكاوى النشطة</h4>
            </div>
            <div className="divide-y divide-gray-50">
              {complaints.map(complaint => (
                <div key={complaint.id} className="p-6 hover:bg-gray-50/50 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className={`w-2 h-12 rounded-full ${
                      complaint.priority === 'عالية' ? 'bg-red-500' : 'bg-secondary'
                    }`}></div>
                    <div>
                      <h5 className="text-sm font-black text-primary-dark mb-1">{complaint.customer}</h5>
                      <p className="text-xs text-gray-400 font-bold">{complaint.type} • {complaint.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">الحالة</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        complaint.status === 'جديد' ? 'bg-red-50 text-red-500' : 
                        complaint.status === 'قيد المعالجة' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                    <button className="p-3 bg-gray-50 text-primary-dark rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-primary-dark hover:text-white">
                      معالجة
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
