import React from 'react';
import { Database } from 'lucide-react';

interface DatabaseManagementSectionProps {
    isSyncing: boolean;
    handleSyncProducts: () => void;
    language: 'ar' | 'en';
}

export const DatabaseManagementSection: React.FC<DatabaseManagementSectionProps> = ({
    isSyncing,
    handleSyncProducts,
    language,
}) => {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-black text-slate-800 uppercase">Sovereign SQL Schema Explorer</h2>
            <div className="bg-slate-50 p-10 rounded-3xl border-2 border-gray-100 font-mono text-sm overflow-x-auto text-primary">
                <pre className="leading-loose">
                    {`CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) UNIQUE,
  phone_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE otp_requests (
  id UUID PRIMARY KEY,
  otp_hash TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE
);

CREATE TABLE units (
  code VARCHAR(10) PRIMARY KEY,
  name_ar VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  base_factor DECIMAL(10,2) NOT NULL
);

INSERT INTO units (code, name_ar, name_en, base_factor) VALUES
('G',     'جرام',      'Gram',      1),
('KG',    'كيلو',      'Kilogram',  1000),
('500G',  '500 جرام',  '500 Grams', 500),
('BUNCH', 'حزمة',      'Bunch',     250),
('PACK',  'باكت',      'Pack',      1000);`}
                </pre>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <button
                    onClick={handleSyncProducts}
                    disabled={isSyncing}
                    className={`flex-1 py-8 rounded-[2rem] font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-4 ${
                        isSyncing
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-primary text-white hover:bg-secondary'
                    }`}
                >
                    <Database className="w-8 h-8" />
                    {isSyncing
                        ? language === 'ar'
                            ? 'جاري المزامنة...'
                            : 'Syncing...'
                        : language === 'ar'
                        ? 'مزامنة كافة المنتجات (250)'
                        : 'Sync All Products (250)'}
                </button>

                <div className="flex-1 bg-secondary/10 p-6 rounded-2xl border-2 border-secondary/20 flex items-center gap-4">
                    <div className="w-4 h-4 bg-secondary rounded-full animate-ping"></div>
                    <p className="text-secondary font-black text-sm uppercase tracking-widest">
                        Active Migration: v50.0_initial_sovereign
                    </p>
                </div>
            </div>
        </div>
    );
};
