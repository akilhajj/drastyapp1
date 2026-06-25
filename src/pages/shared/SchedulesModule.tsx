import React, { useEffect, useState } from 'react';
import { supabase, Subject } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import { Plus, Trash2, CalendarDays, Clock } from 'lucide-react';

interface Schedule {
  id: string;
  subject_id: string;
  teacher_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  notes: string | null;
  is_active: boolean;
}

const EMPTY_FORM = {
  subject_id: '',
  day_of_week: 0,
  start_time: '08:00',
  end_time: '09:00',
  room: '',
  notes: '',
};

export default function SchedulesModule() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const DAY_NAMES: Record<number, string> = {
    0: lang === 'ar' ? 'الأحد' : 'Sunday',
    1: lang === 'ar' ? 'الاثنين' : 'Monday',
    2: lang === 'ar' ? 'الثلاثاء' : 'Tuesday',
    3: lang === 'ar' ? 'الأربعاء' : 'Wednesday',
    4: lang === 'ar' ? 'الخميس' : 'Thursday',
    5: lang === 'ar' ? 'الجمعة' : 'Friday',
    6: lang === 'ar' ? 'السبت' : 'Saturday',
  };

  async function load() {
    const [schRes, subRes] = await Promise.all([
      supabase.from('class_schedules').select('*').order('day_of_week').order('start_time'),
      supabase.from('subjects').select('*').eq('is_active', true).order('order_index'),
    ]);
    setSchedules(schRes.data || []);
    setSubjects(subRes.data || []);
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.subject_id) return;
    setSaving(true);
    await supabase.from('class_schedules').insert({
      ...form,
      teacher_id: user?.id,
      created_by: user?.id,
      is_active: true,
    });
    await load();
    setForm(EMPTY_FORM);
    setAdding(false);
    setSaving(false);
  }

  async function remove(id: string) {
    await supabase.from('class_schedules').delete().eq('id', id);
    setSchedules(s => s.filter(x => x.id !== id));
  }

  function subjectName(id: string) {
    const s = subjects.find(s => s.id === id);
    return s ? (lang === 'ar' ? s.name_ar : s.name_en) : id;
  }

  function subjectColor(id: string) {
    const s = subjects.find(s => s.id === id);
    return s ? s.color_from : '#3b82f6';
  }

  // Group by day
  const byDay = Array.from({ length: 7 }, (_, d) => ({
    day: d,
    items: schedules.filter(s => s.day_of_week === d),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary-400" />
            {t('schedules')}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{t('weeklySchedule')}</p>
        </div>
        <button onClick={() => setAdding(!adding)} className="premium-btn flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('addSchedule')}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <h3 className="font-bold text-white">{t('addSchedule')}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('subjects')}</label>
              <select
                value={form.subject_id}
                onChange={e => setForm({ ...form, subject_id: e.target.value })}
                className="input-field"
              >
                <option value="">{lang === 'ar' ? '-- اختر المادة --' : '-- Select Subject --'}</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('dayOfWeek')}</label>
              <select
                value={form.day_of_week}
                onChange={e => setForm({ ...form, day_of_week: +e.target.value })}
                className="input-field"
              >
                {Object.entries(DAY_NAMES).map(([d, name]) => (
                  <option key={d} value={d}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('room')}</label>
              <input
                value={form.room}
                onChange={e => setForm({ ...form, room: e.target.value })}
                className="input-field"
                placeholder={lang === 'ar' ? 'مثال: قاعة 1A' : 'e.g. Room 1A'}
              />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('startTime')}</label>
              <input
                type="time"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('endTime')}</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</label>
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="input-field"
                placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.subject_id} className="premium-btn">
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : t('save')}
            </button>
            <button onClick={() => setAdding(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* Weekly grid */}
      {byDay.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <CalendarDays className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">{t('noData')}</p>
          <p className="text-white/20 text-sm mt-1">
            {lang === 'ar' ? 'أضف أول حصة دراسية' : 'Add your first class session'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {byDay.map(({ day, items }) => (
            <div key={day} className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary-400" />
                <span className="font-bold text-white">{DAY_NAMES[day]}</span>
                <span className="text-white/30 text-xs ms-auto">{items.length} {lang === 'ar' ? 'حصة' : 'class'}</span>
              </div>
              <div className="divide-y divide-white/5">
                {items.map(sc => (
                  <div key={sc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/3 transition-colors group">
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ background: subjectColor(sc.subject_id) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">{subjectName(sc.subject_id)}</div>
                      <div className="flex items-center gap-2 text-white/40 text-xs mt-0.5">
                        <Clock className="w-3 h-3" />
                        {sc.start_time.slice(0, 5)} – {sc.end_time.slice(0, 5)}
                        {sc.room && <span className="ms-2 px-2 py-0.5 rounded bg-white/10">{sc.room}</span>}
                      </div>
                    </div>
                    {sc.notes && (
                      <div className="text-white/30 text-xs max-w-32 truncate hidden sm:block">{sc.notes}</div>
                    )}
                    <button
                      onClick={() => remove(sc.id)}
                      className="p-1.5 rounded-lg bg-red-500/0 text-white/20 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
