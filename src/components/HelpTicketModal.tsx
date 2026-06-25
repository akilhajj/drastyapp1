import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLang } from '../lib/lang';
import { useAuth } from '../lib/auth';
import { X, Ticket, Send } from 'lucide-react';

interface Props { onClose: () => void }

export default function HelpTicketModal({ onClose }: Props) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!title.trim() || !body.trim() || !profile) return;
    setLoading(true);
    const { data: ticket } = await supabase.from('help_tickets').insert({
      student_id: profile.id,
      title: title.trim(),
      priority,
      status: 'open',
    }).select().maybeSingle();

    if (ticket) {
      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: profile.id,
        sender_role: 'student',
        message: body.trim(),
      });
    }
    setDone(true);
    setLoading(false);
    setTimeout(onClose, 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-6 max-w-md w-full animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Ticket className="w-4 h-4 text-primary-400" />
            </div>
            <h3 className="font-bold text-white">{t('openTicket')}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-semibold">{lang === 'ar' ? 'تم إرسال الطلب بنجاح!' : 'Request sent successfully!'}</p>
            <p className="text-white/40 text-sm mt-1">{lang === 'ar' ? 'سيتواصل معك المعلم قريباً' : 'A teacher will respond shortly'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block font-medium">
                {t('ticketTitle')} <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
                placeholder={lang === 'ar' ? 'مثال: لا أفهم مسألة في الفيزياء...' : 'e.g. I don\'t understand a physics problem...'}
              />
            </div>

            {/* Message body */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block font-medium">
                {t('ticketMessage')} <span className="text-red-400">*</span>
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                className="input-field resize-none"
                rows={4}
                placeholder={lang === 'ar'
                  ? 'اشرح سؤالك أو مشكلتك بالتفصيل هنا...'
                  : 'Explain your question or issue in detail here...'}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block font-medium">
                {lang === 'ar' ? 'الأولوية' : 'Priority'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'low',    arLabel: 'منخفضة', enLabel: 'Low',    color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
                  { val: 'normal', arLabel: 'عادية',  enLabel: 'Normal', color: 'border-primary-500/40 text-primary-400 bg-primary-500/10' },
                  { val: 'high',   arLabel: 'عالية',  enLabel: 'High',   color: 'border-red-500/40 text-red-400 bg-red-500/10' },
                ].map(p => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setPriority(p.val)}
                    className={`py-2 rounded-xl border text-sm font-medium transition-all ${
                      priority === p.val
                        ? p.color
                        : 'border-white/15 text-white/40 hover:text-white/70 hover:border-white/25'
                    }`}
                  >
                    {lang === 'ar' ? p.arLabel : p.enLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={submit}
                disabled={loading || !title.trim() || !body.trim()}
                className="premium-btn flex-1 flex items-center justify-center gap-2"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><Send className="w-4 h-4" />{t('submit')}</>}
              </button>
              <button onClick={onClose} className="premium-btn-outline">{t('cancel')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
