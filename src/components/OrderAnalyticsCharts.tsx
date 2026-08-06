import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Order } from '../types';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingBag,
  Clock,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface OrderAnalyticsChartsProps {
  orders: Order[];
  language?: 'ar' | 'en';
}

export const OrderAnalyticsCharts: React.FC<OrderAnalyticsChartsProps> = ({
  orders = [],
  language = 'ar'
}) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'monthly' | 'distribution'>('daily');
  const [dateRangeDays, setDateRangeDays] = useState<number>(14);

  // Status Color Palette
  const STATUS_COLORS: Record<string, string> = {
    delivered: '#10B981', // Emerald
    completed: '#059669',
    shipped: '#3B82F6',   // Blue
    preparing: '#F59E0B', // Amber
    setup: '#8B5CF6',     // Purple
    pending: '#EC4899',   // Pink
    cancelled: '#EF4444'  // Red
  };

  const STATUS_NAMES_AR: Record<string, string> = {
    delivered: 'تم التوصيل',
    completed: 'مكتمل',
    shipped: 'تم الشحن',
    preparing: 'جاري التجهيز',
    setup: 'إعداد الشحنة',
    pending: 'بانتظار التأكيد',
    cancelled: 'ملغي'
  };

  const PAYMENT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // 1. Calculate Daily Analytics for the past N days
  const dailyData = useMemo(() => {
    const daysMap: Record<string, { date: string; dateLabel: string; count: number; revenue: number; avgValue: number }> = {};
    const now = new Date();

    for (let i = dateRangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const dateLabel = d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric'
      });

      daysMap[isoDate] = {
        date: isoDate,
        dateLabel,
        count: 0,
        revenue: 0,
        avgValue: 0
      };
    }

    orders.forEach((ord) => {
      if (!ord.createdAt) return;
      const dateKey = ord.createdAt.split('T')[0];
      if (daysMap[dateKey]) {
        daysMap[dateKey].count += 1;
        daysMap[dateKey].revenue += ord.total || 0;
      }
    });

    return Object.values(daysMap).map((item) => ({
      ...item,
      avgValue: item.count > 0 ? Math.round(item.revenue / item.count) : 0,
      revenue: Math.round(item.revenue)
    }));
  }, [orders, dateRangeDays, language]);

  // 2. Calculate Monthly Analytics for the last 12 months
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { monthKey: string; monthLabel: string; count: number; revenue: number; avgValue: number }> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
        month: 'short',
        year: '2-digit'
      });

      monthMap[monthKey] = {
        monthKey,
        monthLabel,
        count: 0,
        revenue: 0,
        avgValue: 0
      };
    }

    orders.forEach((ord) => {
      if (!ord.createdAt) return;
      const dateObj = new Date(ord.createdAt);
      if (isNaN(dateObj.getTime())) return;
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[monthKey]) {
        monthMap[monthKey].count += 1;
        monthMap[monthKey].revenue += ord.total || 0;
      }
    });

    return Object.values(monthMap).map((item) => ({
      ...item,
      avgValue: item.count > 0 ? Math.round(item.revenue / item.count) : 0,
      revenue: Math.round(item.revenue)
    }));
  }, [orders, language]);

  // 3. Status Distribution Data
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((ord) => {
      const st = ord.status || 'pending';
      counts[st] = (counts[st] || 0) + 1;
    });

    return Object.keys(counts).map((st) => ({
      name: language === 'ar' ? (STATUS_NAMES_AR[st] || st) : st,
      value: counts[st],
      color: STATUS_COLORS[st] || '#64748B'
    }));
  }, [orders, language]);

  // 4. Payment Method Distribution
  const paymentData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((ord) => {
      const pm = ord.paymentMethod || 'cod';
      const label = pm.toLowerCase().includes('mada')
        ? 'مدى Mada'
        : pm.toLowerCase().includes('apple')
        ? 'Apple Pay'
        : pm.toLowerCase().includes('tamara') || pm.toLowerCase().includes('tabby')
        ? 'تمارا / تابي'
        : pm.toLowerCase().includes('card') || pm.toLowerCase().includes('visa')
        ? 'بطاقة ائتمان'
        : 'الدفع نقداً COD';
      counts[label] = (counts[label] || 0) + 1;
    });

    return Object.keys(counts).map((pm, idx) => ({
      name: pm,
      value: counts[pm],
      color: PAYMENT_COLORS[idx % PAYMENT_COLORS.length]
    }));
  }, [orders]);

  // Overall KPIs
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.total || 0), 0), [orders]);
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const completedOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'completed').length;
  const completionRate = orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 0;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-amber-500/30 text-xs space-y-2 backdrop-blur-md font-tajawal">
          <p className="font-black text-amber-300 border-b border-white/10 pb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 font-bold">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-mono text-white">
                {typeof entry.value === 'number' && entry.name.includes('إيرادات') || entry.name.includes('Revenue') || entry.name.includes('متوسط')
                  ? `${entry.value.toLocaleString()} ر.س`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-tajawal">
      {/* Top Header Controls & KPI Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-2xl border border-amber-500/20 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-amber-500 to-amber-300 text-slate-950 rounded-2xl shadow-xl">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black rounded-lg uppercase">
                  RECHARTS VISUALIZATION ENGINE
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  تحليل بياني مسبار
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-amber-100">
                {language === 'ar' ? 'الإحصائيات البيانية للطلبات والتدفق المالي' : 'Order & Revenue Analytics Charting'}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">
                تتبع مسار العمليات، معدل نمو المبيعات اليومية والشهرية، وتوزيع وسائل الدفع بيانيًا بشكل تفاعلي.
              </p>
            </div>
          </div>

          {/* Timeframe Selector Buttons */}
          <div className="flex flex-wrap items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/10 w-full lg:w-auto">
            <button
              onClick={() => setTimeframe('daily')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
                timeframe === 'daily'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {language === 'ar' ? 'التحليل اليومي' : 'Daily Trend'}
            </button>

            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
                timeframe === 'monthly'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {language === 'ar' ? 'التحليل الشهري' : 'Monthly Trend'}
            </button>

            <button
              onClick={() => setTimeframe('distribution')}
              className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 ${
                timeframe === 'distribution'
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
              {language === 'ar' ? 'توزيع الحالات والدفع' : 'Distribution'}
            </button>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase">
              {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
            </span>
            <div className="text-2xl font-black text-white font-mono">{orders.length}</div>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              {language === 'ar' ? 'تدفق مستقر' : 'Stable Flow'}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase">
              {language === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'}
            </span>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {totalRevenue.toLocaleString()} <span className="text-xs">ر.س</span>
            </div>
            <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {language === 'ar' ? 'القيمة التراكمية' : 'Cumulative Sum'}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase">
              {language === 'ar' ? 'متوسط قيمة الطلب' : 'Avg Order Value'}
            </span>
            <div className="text-2xl font-black text-cyan-300 font-mono">
              {avgOrderValue.toLocaleString()} <span className="text-xs">ر.س</span>
            </div>
            <p className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {language === 'ar' ? 'سلة التسوق' : 'Cart Avg'}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <span className="text-[10px] text-slate-400 font-black uppercase">
              {language === 'ar' ? 'نسبة المبيعات الناجحة' : 'Completion Rate'}
            </span>
            <div className="text-2xl font-black text-emerald-300 font-mono">{completionRate}%</div>
            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completedOrders} {language === 'ar' ? 'طلب مكتمل' : 'Delivered'}
            </p>
          </div>
        </div>
      </div>

      {/* CHART SECTION 1: DAILY TREND (Area & Bar Chart) */}
      {timeframe === 'daily' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  {language === 'ar' ? 'منحنى حركة الطلبات والإيرادات اليومية' : 'Daily Orders & Revenue Volume'}
                </h3>
                <p className="text-xs text-gray-400 font-bold mt-1">
                  متابعة الإيرادات (ر.س) وعدد الطلبات لكل يوم بشكل آلي.
                </p>
              </div>

              {/* Range Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'النطاق:' : 'Range:'}
                </span>
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDateRangeDays(days)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition ${
                      dateRangeDays === days
                        ? 'bg-slate-900 text-amber-300 shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {days} {language === 'ar' ? 'يوم' : 'Days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Area Chart Component */}
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                    tickFormatter={(val) => `${val}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#10B981', fontSize: 11, fontWeight: 700 }}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: '800' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    name={language === 'ar' ? 'الإيرادات (ر.س)' : 'Revenue (SAR)'}
                    stroke="#F59E0B"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    name={language === 'ar' ? 'عدد الطلبات' : 'Order Count'}
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart Component - Average Order Value Daily */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b pb-4">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              {language === 'ar' ? 'متوسط قيمة السلة اليومية (ر.س)' : 'Daily Average Order Value'}
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="dateLabel" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="avgValue"
                    name={language === 'ar' ? 'متوسط السلة (ر.س)' : 'Avg Value (SAR)'}
                    fill="#6366F1"
                    radius={[10, 10, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CHART SECTION 2: MONTHLY TREND (Bar & Line Chart) */}
      {timeframe === 'monthly' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                {language === 'ar' ? 'المقارنة الشهرية لحجم المبيعات والطلبات (12 شهراً)' : 'Monthly Revenue & Order Volume Comparison'}
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">
                تحديد مواسم الذروة والنمو المستمر عبر كافة أشهر السنة.
              </p>
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="monthLabel" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                  <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#3B82F6', fontSize: 11, fontWeight: 700 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: '800' }} />
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name={language === 'ar' ? 'المبيعات الشهرية (ر.س)' : 'Monthly Sales (SAR)'}
                    fill="#F59E0B"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="count"
                    name={language === 'ar' ? 'عدد الطلبات' : 'Order Count'}
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b pb-4">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              {language === 'ar' ? 'منحنى النمو في متوسط قيمة الفاتورة الشهرية' : 'Monthly Average Order Value Curve'}
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="monthLabel" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="avgValue"
                    name={language === 'ar' ? 'متوسط السلة (ر.س)' : 'Monthly Avg (SAR)'}
                    stroke="#10B981"
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#059669' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* CHART SECTION 3: DISTRIBUTION (Pie Charts) */}
      {timeframe === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Breakdown Pie Chart */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-amber-500" />
                {language === 'ar' ? 'توزيع الطلبات حسب حالة المعالجة' : 'Orders by Processing Status'}
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">
                توزيع شامل بين الطلبات المكتملة، قيد التجهيز والملغاة.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: '800' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Pie Chart */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" />
                {language === 'ar' ? 'توزيع العمليات حسب وسائل الدفع' : 'Orders by Payment Gateway'}
              </h3>
              <p className="text-xs text-gray-400 font-bold mt-1">
                نسبة الاعتماد على مدى، أبل باي، تمارا وتابي والدفع النقدي.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: '800' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAnalyticsCharts;
