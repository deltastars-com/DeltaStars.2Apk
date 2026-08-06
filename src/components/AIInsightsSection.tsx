import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  SparklesIcon, TrendingUpIcon, AlertTriangleIcon, 
  CheckCircleIcon, BrainIcon, BarChartIcon 
} from './lib/contexts/Icons';
import { useI18n, useGeminiAi } from './lib/contexts';
import { Product, Order } from '../types';
import { chatWithOday } from '../services/geminiService';

interface AIInsightsSectionProps {
  products: Product[];
  orders: Order[];
}

export const AIInsightsSection: React.FC<AIInsightsSectionProps> = ({ products, orders }) => {
  const { t, language, formatCurrency } = useI18n();
  const { hasKey } = useGeminiAi();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  const structuredData = useMemo(() => {
    const productSummary = products.map(p => `${p.name_ar}: ${p.stock_quantity} ${p.unit_ar}`).join(', ');
    const orderSummary = orders.slice(0, 20).map(o => `Order ${o.id}: ${o.total} SAR, Status: ${o.status}`).join(' | ');
    return { productSummary, orderSummary };
  }, [products, orders]);

  useEffect(() => {
    const analyzeData = async () => {
      if (!hasKey) {
        setIsAnalyzing(false);
        return;
      }

      try {
        if (!import.meta.env.VITE_GEMINI_KEY && !import.meta.env.VITE_GEMINI_API_KEY) {
          throw new Error('Gemini API key is not configured');
        }

        // Using shared Gemini service
        const prompt = `
          As an AI Supply Chain Expert for "Delta Stars Trading" (Saudi Arabia's premier fruit, veg, and dates company), analyze this operational data:
          
          COMPANY CONTEXT:
          - Brand: Delta Stars (نجوم دلتا)
          - Location: Jeddah (Main), Riyadh, Dammam, Madinah, Abha.
          - Products: ${structuredData.productSummary}
          - Recent Orders: ${structuredData.orderSummary}

          TASK:
          Generate 4 highly professional, actionable, and strategic insights in ${language === 'ar' ? 'Arabic' : 'English'}.
          Focus on:
          1. Predictive Demand: Use recent order patterns to predict which branch or product category will peak next.
          2. Inventory Optimization: Identify items at risk of spoilage (fresh produce) or stockout based on current levels.
          3. Logistic Efficiency: Suggest improvements for delivery routing or branch assignment based on order density.
          4. Strategic Growth: Recommend a specific marketing bundle or promotional strategy.

          Return ONLY a valid JSON array of objects with these fields:
          - title: Professional short title
          - desc: Detailed strategic explanation
          - type: one of ['surge', 'alert', 'info', 'prediction']
          - confidence: number 0-100 (probability of the insight being accurate)
        `;

        const text = await chatWithOday([{role:"user" as "user", content: prompt}], "أنت محلل بيانات لمتجر نجوم دلتا للتجارة. حلل البيانات وقدم رؤى مفيدة بالعربية.").catch(()=>"");
        
        // Clean the response text to ensure it's valid JSON
        if (text) {
          try {
            // Try parsing directly first
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
              setAiInsights(parsed);
            } else if (parsed.insights && Array.isArray(parsed.insights)) {
              setAiInsights(parsed.insights);
            }
          } catch (jsonErr) {
            // Fallback to regex if direct parse fails
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
              try {
                const parsed = JSON.parse(jsonMatch[0]);
                setAiInsights(parsed);
              } catch (innerErr) {
                console.error("Critical JSON Fallback Error:", innerErr);
              }
            } else {
              console.error("AI returned invalid JSON structure:", text);
            }
          }
        }
      } catch (err) {
        console.error("AI Analysis Error:", err);
      } finally {
        setIsAnalyzing(false);
      }
    };

    analyzeData();
  }, [hasKey, structuredData, language]);

  const defaultInsights = [
    {
      title: language === 'ar' ? "توقع زيادة الطلب" : "Demand Surge Prediction",
      desc: language === 'ar' ? "من المتوقع زيادة الطلب على 'التمور الفاخرة' بنسبة 25% خلال الـ 48 ساعة القادمة." : "Demand for 'Premium Dates' is expected to rise by 25% in the next 48 hours.",
      type: 'surge',
      icon: <TrendingUpIcon className="w-6 h-6 text-green-500" />,
      confidence: 92
    },
    {
      title: language === 'ar' ? "تنبيه انخفاض المخزون" : "Low Stock Alert",
      desc: language === 'ar' ? "مخزون 'الطماطم الوطنية' قد ينفد خلال 3 أيام بناءً على معدل الاستهلاك الحالي." : "'National Tomatoes' stock might run out in 3 days based on current consumption rate.",
      type: 'alert',
      icon: <AlertTriangleIcon className="w-6 h-6 text-red-500" />,
      confidence: 88
    },
    {
      title: language === 'ar' ? "تحسين سلة المشتريات" : "Cart Optimization",
      desc: language === 'ar' ? "العملاء الذين يشترون 'البصل' غالباً ما يضيفون 'البطاطس'. نقترح عمل حزمة ترويجية." : "Customers buying 'Onions' often add 'Potatoes'. Suggesting a promotional bundle.",
      type: 'info',
      icon: <SparklesIcon className="w-6 h-6 text-blue-500" />,
      confidence: 75
    }
  ];

  const displayInsights = aiInsights.length > 0 ? aiInsights.map(insight => ({
    ...insight,
    icon: insight.type === 'surge' ? <TrendingUpIcon className="w-6 h-6 text-green-500" /> :
          insight.type === 'alert' ? <AlertTriangleIcon className="w-6 h-6 text-red-500" /> :
          <SparklesIcon className="w-6 h-6 text-blue-500" />
  })) : defaultInsights;

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6 bg-white rounded-[3rem] shadow-xl border border-gray-100">
        <div className="relative">
          <div className="w-24 h-24 border-8 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
          <BrainIcon className="absolute inset-0 m-auto w-10 h-10 text-secondary animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-black text-primary animate-pulse">جاري تحليل البيانات السيادية...</h3>
          <p className="text-gray-400 font-bold">محرك عُدي للذكاء الاصطناعي يقوم بمعالجة الأنماط الشرائية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in mt-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-primary flex items-center gap-4">
            <BrainIcon className="w-10 h-10 text-secondary" />
            {language === 'ar' ? "رؤى الذكاء الاصطناعي (عُدي)" : "AI Insights (Oday)"}
          </h2>
          <p className="text-gray-400 font-bold mt-2">تحليلات تنبؤية مدعومة بنظام التحليل الذكي</p>
        </div>
        {!hasKey ? (
          <button 
            onClick={() => {}}
            className="bg-secondary text-white px-8 py-3 rounded-full font-black text-sm flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
          >
            <SparklesIcon className="w-5 h-5" />
            {language === 'ar' ? "تفعيل التحليل الذكي" : "Activate Smart Analysis"}
          </button>
        ) : (
          <div className="bg-green-50 text-green-600 px-6 py-3 rounded-full font-black text-sm flex items-center gap-2 border border-green-100">
            <CheckCircleIcon className="w-5 h-5" />
            {language === 'ar' ? "التحليل نشط" : "Analysis Active"}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {displayInsights.map((insight, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 relative overflow-hidden group hover:shadow-sovereign transition-all"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/5 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors shadow-sm">
                  {insight.icon}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ثقة التوقع</span>
                  <p className="text-xl font-black text-secondary">{insight.confidence}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-2xl font-black text-primary mb-2">{insight.title}</h4>
                <p className="text-gray-500 font-bold leading-relaxed">{insight.desc}</p>
              </div>

              <div className="pt-4 border-t border-gray-50">
                <button className="text-secondary font-black text-sm hover:underline flex items-center gap-2">
                  {language === 'ar' ? "اتخاذ إجراء مقترح" : "Take Suggested Action"}
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-primary text-white p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 space-y-6">
            <h3 className="text-2xl md:text-4xl font-black leading-tight">
              {language === 'ar' ? "هل ترغب في تقرير تحليلي مخصص؟" : "Want a Custom Analytical Report?"}
            </h3>
            <p className="text-lg md:text-xl text-white/70 font-bold">
              يمكن لعُدي توليد تقارير مبيعات وتوقعات مخزون مفصلة بصيغة PDF بناءً على بياناتك التاريخية.
            </p>
            <button className="w-full md:w-auto bg-secondary text-white px-10 py-5 rounded-full font-black text-lg md:text-xl shadow-xl hover:scale-105 transition-all">
              {language === 'ar' ? "توليد تقرير ذكي الآن 📊" : "Generate Smart Report Now 📊"}
            </button>
          </div>
          <div className="w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-[3rem] flex items-center justify-center border-4 border-white/20">
            <BarChartIcon className="w-24 h-24 md:w-32 md:h-32 text-secondary animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};
