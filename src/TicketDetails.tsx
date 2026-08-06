import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { sanitizeEmailForDisplay } from './constants';

interface Reply {
  id: string;
  text: string;
  sender_name: string;
  is_admin: boolean;
  created_at: string;
}

export default function TicketDetails() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchTicket = async () => {
      const { data } = await supabase.from('support_tickets').select('*').eq('id', id).single();
      setTicket(data);
    };
    const fetchReplies = async () => {
      const { data } = await supabase.from('ticket_replies').select('*').eq('ticket_id', id).order('created_at', { ascending: true });
      if (data) setReplies(data);
    };
    fetchTicket();
    fetchReplies();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel(`ticket-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies', filter: `ticket_id=eq.${id}` }, (payload) => {
        setReplies(prev => [...prev, payload.new as Reply]);
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [id]);

  const sendReply = async () => {
    if (!replyText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('ticket_replies').insert({
      ticket_id: id,
      sender_id: user?.id,
      sender_name: user?.user_metadata?.name || 'المشرف',
      text: replyText,
      is_admin: true
    });
    setReplyText('');
  };

  if (!ticket) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <h2 className="text-2xl font-bold">{ticket.subject}</h2>
        <p>من: {ticket.user_name} ({sanitizeEmailForDisplay(ticket.email)})</p>
        <p className="text-sm text-gray-500">{new Date(ticket.created_at).toLocaleString()}</p>
      </div>
      <div className="bg-gray-50 rounded-2xl p-6 h-96 overflow-y-auto mb-6">
        {replies.map((r, idx) => (
          <div key={idx} className={`mb-4 flex ${r.is_admin ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] p-4 rounded-2xl ${r.is_admin ? 'bg-primary text-white' : 'bg-white shadow'}`}>
              <p className="font-bold text-sm">{r.sender_name}</p>
              <p>{r.text}</p>
              <p className="text-[10px] opacity-70 mt-1">{new Date(r.created_at).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3} className="flex-1 border rounded-2xl p-4" placeholder="اكتب ردك..."></textarea>
        <button onClick={sendReply} className="bg-primary text-white px-6 py-2 rounded-2xl">إرسال</button>
      </div>
    </div>
  );
}
