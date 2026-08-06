import React, { useState, useEffect } from 'react';
import { COMPANY_INFO, SOCIAL_LINKS } from '../constants';
import { 
  PhoneIcon, GlobeIcon, MapPinIcon, MessageCircleIcon,
  WhatsappIcon, InstagramIcon, TiktokIcon, TwitterXIcon,
  FacebookIcon, YoutubeIcon, SnapchatIcon, TelegramIcon,
  SendIcon, UserIcon, ClockIcon, XIcon
} from './lib/contexts/Icons';
import { useFirebase } from './lib/contexts/FirebaseContext';
import { db, collection, addDoc, query, where, orderBy, onSnapshot, handleFirestoreError, OperationType, updateDoc, doc } from '@/firebase';
import { useToast } from './lib/contexts';

interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    subject: string;
    status: 'open' | 'in-progress' | 'closed';
    priority: 'low' | 'medium' | 'high';
    createdAt: string;
    lastMessageAt: string;
    messages: {
        senderId: string;
        senderName: string;
        text: string;
        createdAt: string;
        isAdmin: boolean;
    }[];
}

const SocialIcon = ({ name, className }: { name: string, className?: string }) => {
  const iconKey = name.toLowerCase();
  switch (iconKey) {
    case 'whatsapp_community': return <WhatsappIcon className={className} />;
    case 'instagram': return <InstagramIcon className={className} />;
    case 'tiktok': return <TiktokIcon className={className} />;
    case 'facebook':
    case 'facebook_group': return <FacebookIcon className={className} />;
    case 'youtube': return <YoutubeIcon className={className} />;
    case 'snapchat': return <SnapchatIcon className={className} />;
    case 'telegram':
    case 'telegram_channel': return <TelegramIcon className={className} />;
    case 'corporate_site': return <GlobeIcon className={className} />;
    default: return <GlobeIcon className={className} />;
  }
};

export function ContactPage() {
  const { user, firebaseUser } = useFirebase();
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useNetlifyForm, setUseNetlifyForm] = useState(true); // Fallback تلقائي

  // استخدام Netlify Forms أو Firebase حسب التوفر
  useEffect(() => {
    // فحص ما إذا كان الـ Netlify Forms يعمل
    const checkNetlifyForms = async () => {
      try {
        const res = await fetch('/.netlify/functions/contact-form', { method: 'HEAD' });
        if (!res.ok) setUseNetlifyForm(false);
      } catch {
        setUseNetlifyForm(false);
      }
    };
    checkNetlifyForms();
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) return;
    const q = query(
      collection(db, 'support_tickets'), 
      where('userId', '==', firebaseUser.uid),
      orderBy('lastMessageAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
      setTickets(ticketList);
      if (activeTicket) {
        const updated = ticketList.find(t => t.id === activeTicket.id);
        if (updated) setActiveTicket(updated);
      }
    });
    return () => unsubscribe();
  }, [firebaseUser, activeTicket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
        addToast('يرجى ملء جميع الحقول', 'warning');
        return;
    }

    setIsLoading(true);
    let success = false;

    // المحاولة الأولى: Netlify Forms (إن كان مفعلاً)
    if (useNetlifyForm) {
      try {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('subject', subject);
        formData.append('message', message);
        formData.append('form-name', 'contact');
        
        const response = await fetch('/', {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          addToast('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', 'success');
          setSubject('');
          setMessage('');
          success = true;
        } else {
          throw new Error('Netlify Forms failed');
        }
      } catch (err) {
        console.warn('Netlify Forms error, falling back to Firebase', err);
        success = false;
      }
    }

    // المحاولة الاحتياطية: Firebase (إذا فشلت Netlify)
    if (!success) {
      try {
        const timestamp = new Date().toISOString();
        const ticketData = {
            userId: firebaseUser?.uid || 'anonymous',
            userName: name,
            email,
            subject,
            status: 'open',
            priority: 'medium',
            createdAt: timestamp,
            lastMessageAt: timestamp,
            messages: [{
                senderId: firebaseUser?.uid || 'anonymous',
                senderName: name,
                text: message,
                createdAt: timestamp,
                isAdmin: false
            }]
        };
        const docRef = await addDoc(collection(db, 'support_tickets'), ticketData);
        addToast('تم إرسال رسالتك بنجاح (نسخة احتياطية). سيتم الرد عليك قريباً.', 'success');
        setSubject('');
        setMessage('');
        setActiveTicket({ id: docRef.id, ...ticketData } as any);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'support_tickets');
        addToast('فشل إرسال الرسالة، يرجى المحاولة مرة أخرى لاحقاً.', 'error');
      }
    }
    setIsLoading(false);
  };

  const handleSendMessage = async () => {
    if (!activeTicket || !newMessage.trim()) return;
    const msg = {
        senderId: firebaseUser?.uid || 'anonymous',
        senderName: name || 'User',
        text: newMessage,
        createdAt: new Date().toISOString(),
        isAdmin: false
    };
    try {
        await updateDoc(doc(db, 'support_tickets', activeTicket.id), {
            messages: [...activeTicket.messages, msg],
            lastMessageAt: msg.createdAt,
            status: 'open'
        });
        setNewMessage('');
    } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'support_tickets');
    }
  };

  return (
    <div className="animate-fade-in bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary text-white py-32 border-b-[10px] border-secondary text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80')] bg-cover"></div>
        <div className="relative z-10 container mx-auto px-6">
          <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6">تواصل معنا</h2>
          <p className="text-xl md:text-2xl text-secondary font-bold italic">نحن هنا لخدمتكم على مدار الساعة</p>
        </div>
      </div>

      <div className="container mx-auto px-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Cards */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-sovereign border border-gray-100 space-y-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary">
                <PhoneIcon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-primary">اتصل بنا</h3>
                <p className="text-gray-400 font-bold text-sm">الخط الأرضي: {COMPANY_INFO.phone}</p>
                <p className="text-gray-400 font-bold text-sm">واتساب: {COMPANY_INFO.whatsapp}</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] shadow-sovereign border border-gray-100 space-y-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary">
                <GlobeIcon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-primary">البريد الإلكتروني</h3>
                <p className="text-gray-400 font-bold text-sm">{COMPANY_INFO.email}</p>
              </div>
            </div>

            {firebaseUser && tickets.length > 0 && (
                <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl space-y-6">
                    <h3 className="text-xl font-black text-secondary uppercase tracking-widest">محادثاتي النشطة</h3>
                    <div className="space-y-3">
                        {tickets.map(t => (
                            <button key={t.id} onClick={() => setActiveTicket(t)} className={`w-full p-4 rounded-2xl text-right transition-all border-2 ${activeTicket?.id === t.id ? 'bg-secondary text-white border-secondary' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                <p className="font-black text-sm truncate">{t.subject}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className={`text-[8px] px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                        {t.status === 'open' ? 'نشط' : 'قيد المعالجة'}
                                    </span>
                                    <span className="text-[8px] opacity-40 uppercase">{new Date(t.lastMessageAt).toLocaleDateString()}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-9">
            {activeTicket ? (
                <div className="bg-white rounded-[4rem] shadow-sovereign border border-gray-100 flex flex-col h-[700px] overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <MessageCircleIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-primary tracking-tighter">{activeTicket.subject}</h3>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">دعم دلتا ستارز المباشر</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveTicket(null)} className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-10 space-y-6 flex flex-col-reverse">
                        <div className="space-y-6">
                            {activeTicket.messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] p-6 rounded-[2.5rem] shadow-sm ${msg.isAdmin ? 'bg-slate-100 text-slate-800 rounded-tr-none' : 'bg-primary text-white rounded-tl-none'}`}>
                                        <div className="flex items-center gap-3 mb-2 opacity-60">
                                            <span className="text-[10px] font-black uppercase tracking-widest">{msg.senderName}</span>
                                            <span className="text-[8px] font-bold">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="font-bold leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-8 border-t border-gray-100 bg-white">
                        <div className="flex gap-4">
                            <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="اكتب ردك هنا..." className="flex-grow p-6 bg-slate-50 rounded-[2.5rem] border-2 border-transparent focus:border-secondary transition-all outline-none font-bold" />
                            <button onClick={handleSendMessage} className="p-6 bg-secondary text-white rounded-[2.5rem] shadow-xl hover:scale-105 transition-all">
                                <SendIcon className="w-8 h-8" />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-sovereign border border-gray-100">
                    <h3 className="text-4xl font-black text-primary mb-12">أرسل لنا رسالة ✉️</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8" data-netlify="true" name="contact" method="POST">
                      <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">الاسم الكامل</label>
                        <input required type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="أدخل اسمك هنا" name="name" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-secondary rounded-2xl outline-none font-bold transition-all" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</label>
                        <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="example@mail.com" name="email" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-secondary rounded-2xl outline-none font-bold transition-all" />
                      </div>
                      <div className="space-y-4 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">الموضوع</label>
                        <input required type="text" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="كيف يمكننا مساعدتك؟" name="subject" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-secondary rounded-2xl outline-none font-bold transition-all" />
                      </div>
                      <div className="space-y-4 md:col-span-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">الرسالة</label>
                        <textarea required rows={6} value={message} onChange={e=>setMessage(e.target.value)} placeholder="اكتب رسالتك بالتفصيل..." name="message" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-secondary rounded-2xl outline-none font-bold transition-all resize-none"></textarea>
                      </div>
                      <div className="md:col-span-2">
                        <button type="submit" disabled={isLoading} className="w-full bg-primary text-white py-6 rounded-3xl font-black text-2xl shadow-sovereign hover:bg-black transition-all">
                            {isLoading ? 'جاري الإرسال...' : 'بدء محادثة فورية 🚀'}
                        </button>
                      </div>
                    </form>
                </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-24">
        <div className="bg-white p-4 rounded-[4rem] shadow-sovereign border border-gray-100 overflow-hidden h-[500px] relative group">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3711.123456789!2d39.2238!3d21.5678!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDM0JzA0LjEiTiAzOcKwMTMnMjUuNyJF!5e0!3m2!1sen!2ssa!4v1620000000000!5m2!1sen!2ssa" 
            width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="rounded-[3.5rem]">
          </iframe>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-24">
        <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-gray-100 text-center space-y-12">
          <h3 className="text-3xl font-black text-primary">تابعنا على منصات التواصل الاجتماعي</h3>
          <div className="flex flex-wrap justify-center gap-10">
            {Object.entries(SOCIAL_LINKS)
              .filter(([key]) => !['LINKTREE', 'linktree', 'WEBSITE', 'MAP'].includes(key.toUpperCase()))
              .map(([key, url]) => (
              <a key={key} href={url} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center group-hover:bg-secondary group-hover:scale-110 transition-all shadow-lg border border-gray-100">
                  <SocialIcon name={key} className="w-10 h-10 text-primary group-hover:text-white transition-all" />
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-all">{key.replace('_', ' ')}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
      }
