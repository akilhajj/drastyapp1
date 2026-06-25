import React, { useEffect, useState } from 'react';
import { supabase, Subject, LessonPlan, LessonSubtopic, TargetAudience } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import {
  BookMarked, Plus, Trash2, ArrowLeft, Clock, Users,
  Check, ChevronDown, ChevronUp, Image as ImageIcon,
  Globe, Eye, EyeOff
} from 'lucide-react';

type View = 'list' | 'create' | 'edit';

const AUDIENCE_OPTIONS: { val: TargetAudience; ar: string; en: string }[] = [
  { val: 'grade_9',      ar: 'تاسع أساسي',    en: 'Grade 9 Basic' },
  { val: 'bac_science',  ar: 'بكالوريا علمي', en: 'Bac Science' },
  { val: 'bac_literary', ar: 'بكالوريا أدبي', en: 'Bac Literary' },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LessonPlannerModule() {
  const [view, setView] = useState<View>('list');
  const [editPlan, setEditPlan] = useState<LessonPlan | null>(null);

  function openEdit(plan: LessonPlan) { setEditPlan(plan); setView('edit'); }
  function back() { setEditPlan(null); setView('list'); }

  return (
    <div className="animate-fade-in">
      {view === 'list'   && <PlanList onNew={() => setView('create')} onEdit={openEdit} />}
      {view === 'create' && <PlanForm onBack={back} onSaved={back} />}
      {view === 'edit'   && editPlan && <PlanEditor plan={editPlan} onBack={back} />}
    </div>
  );
}

// ─── Plan list ────────────────────────────────────────────────────────────────
function PlanList({ onNew, onEdit }: { onNew: () => void; onEdit: (p: LessonPlan) => void }) {
  const { t, lang } = useLang();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    const [pRes, sRes] = await Promise.all([
      supabase.from('lesson_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('is_active', true),
    ]);
    const list = (pRes.data || []) as LessonPlan[];
    setPlans(list);
    setSubjects(sRes.data || []);
    const c: Record<string, number> = {};
    await Promise.all(list.map(async p => {
      const { count } = await supabase
        .from('lesson_subtopics').select('id', { count: 'exact', head: true }).eq('plan_id', p.id);
      c[p.id] = count || 0;
    }));
    setCounts(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function deletePlan(id: string) {
    await supabase.from('lesson_plans').delete().eq('id', id);
    setPlans(p => p.filter(x => x.id !== id));
  }

  async function togglePublish(plan: LessonPlan) {
    await supabase.from('lesson_plans').update({ is_published: !plan.is_published }).eq('id', plan.id);
    setPlans(p => p.map(x => x.id === plan.id ? { ...x, is_published: !plan.is_published } : x));
  }

  function subjectName(id: string | null) {
    if (!id) return '—';
    const s = subjects.find(s => s.id === id);
    return s ? (lang === 'ar' ? s.name_ar : s.name_en) : '—';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-primary-400" />
            {t('lessonPlanner')}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{plans.length} {lang === 'ar' ? 'خطة درس' : 'lesson plans'}</p>
        </div>
        <button onClick={onNew} className="premium-btn flex items-center gap-2">
          <Plus className="w-4 h-4" />{t('createPlan')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer-bg rounded-2xl" />)}</div>
      ) : plans.length === 0 ? (
        <div className="glass-card p-14 text-center">
          <BookMarked className="w-14 h-14 text-white/15 mx-auto mb-3" />
          <p className="text-white/30">{t('noData')}</p>
          <p className="text-white/20 text-sm mt-1">{lang === 'ar' ? 'أنشئ أول خطة درس تفاعلية' : 'Create your first interactive lesson plan'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="glass-card p-5 group hover:border-white/25 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{lang === 'ar' ? plan.title_ar : plan.title_en}</h3>
                  <p className="text-white/40 text-xs mt-0.5">{subjectName(plan.subject_id)}</p>
                </div>
                <span className={`badge ms-3 shrink-0 ${plan.is_published ? 'badge-success' : 'badge-warning'}`}>
                  {plan.is_published ? (lang === 'ar' ? 'منشور' : 'Published') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{plan.total_minutes} {lang === 'ar' ? 'دقيقة' : 'min'}</span>
                <span className="flex items-center gap-1"><BookMarked className="w-3 h-3" />{counts[plan.id] ?? 0} {lang === 'ar' ? 'موضوع' : 'topics'}</span>
                {plan.target_audience?.length > 0 && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{plan.target_audience.length}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => onEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm transition-colors">
                  {lang === 'ar' ? 'إدارة المواضيع' : 'Manage Topics'}
                </button>
                <button onClick={() => togglePublish(plan)}
                  className={`p-2 rounded-xl transition-colors ${plan.is_published ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'} hover:opacity-80`}>
                  {plan.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => deletePlan(plan.id)}
                  className="p-2 rounded-xl bg-red-500/0 text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Plan Form (create only) ───────────────────────────────────────────────────
function PlanForm({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject_id: '',
    title_ar: '',
    title_en: '',
    description_ar: '',
    total_minutes: 40 as 40 | 60,
    target_audience: [] as TargetAudience[],
  });

  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).order('order_index')
      .then(({ data }) => setSubjects(data || []));
  }, []);

  function toggleAudience(val: TargetAudience) {
    setForm(f => ({
      ...f,
      target_audience: f.target_audience.includes(val)
        ? f.target_audience.filter(a => a !== val)
        : [...f.target_audience, val],
    }));
  }

  async function save() {
    if (!form.title_ar.trim()) return;
    setSaving(true);
    const audience = form.target_audience.length ? form.target_audience : ['grade_9', 'bac_science', 'bac_literary'];
    await supabase.from('lesson_plans').insert({
      subject_id: form.subject_id || null,
      teacher_id: user?.id,
      title_ar: form.title_ar,
      title_en: form.title_en,
      description_ar: form.description_ar || null,
      total_minutes: form.total_minutes,
      target_audience: audience,
      is_published: false,
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 glass rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-white">{t('createPlan')}</h1>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('planTitle')} (AR) *</label>
            <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })}
              className="input-field" placeholder={lang === 'ar' ? 'عنوان الخطة بالعربية' : 'Plan title in Arabic'} />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('planTitle')} (EN)</label>
            <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })}
              className="input-field" placeholder="Plan title in English" />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('subjects')}</label>
            <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="input-field">
              <option value="">{lang === 'ar' ? '-- عام --' : '-- General --'}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>)}
            </select>
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('totalDuration')}</label>
            <div className="grid grid-cols-2 gap-2">
              {([40, 60] as const).map(m => (
                <button key={m} type="button" onClick={() => setForm({ ...form, total_minutes: m })}
                  className={`py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    form.total_minutes === m
                      ? 'bg-primary-600/30 border-primary-500/50 text-white'
                      : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white'
                  }`}>
                  <Clock className="w-3.5 h-3.5" />
                  {m} {lang === 'ar' ? 'دقيقة' : 'min'}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'وصف مختصر' : 'Brief Description'}</label>
            <textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })}
              className="input-field" rows={2} />
          </div>
        </div>

        {/* Target audience */}
        <div>
          <label className="text-white/50 text-sm mb-2 block">{t('targetAudience')}</label>
          <div className="flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map(opt => (
              <button key={opt.val} type="button" onClick={() => toggleAudience(opt.val)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                  form.target_audience.includes(opt.val)
                    ? 'bg-primary-600/30 border-primary-500/50 text-white'
                    : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white'
                }`}>
                {form.target_audience.includes(opt.val) && <Check className="w-3.5 h-3.5" />}
                {lang === 'ar' ? opt.ar : opt.en}
              </button>
            ))}
            <span className="text-white/25 text-xs self-center">
              {form.target_audience.length === 0 ? (lang === 'ar' ? '(سيظهر للجميع)' : '(shown to all)') : ''}
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={save} disabled={saving || !form.title_ar.trim()} className="premium-btn flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4" />{lang === 'ar' ? 'إنشاء والمتابعة' : 'Create & Continue'}</>}
          </button>
          <button onClick={onBack} className="premium-btn-outline">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Plan Editor (add/manage subtopics) ────────────────────────────────────────
function PlanEditor({ plan, onBack }: { plan: LessonPlan; onBack: () => void }) {
  const { t, lang } = useLang();
  const [subtopics, setSubtopics] = useState<LessonSubtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingIdx, setAddingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const EMPTY_ST = { title_ar: '', title_en: '', duration_minutes: 10, content_ar: '', content_en: '', image_url: '' };
  const [form, setForm] = useState(EMPTY_ST);

  async function loadSubtopics() {
    const { data } = await supabase.from('lesson_subtopics')
      .select('*').eq('plan_id', plan.id).order('order_index');
    setSubtopics((data || []) as LessonSubtopic[]);
    setLoading(false);
  }
  useEffect(() => { loadSubtopics(); }, [plan.id]);

  const usedMinutes = subtopics.reduce((s, st) => s + st.duration_minutes, 0);
  const remainingMinutes = plan.total_minutes - usedMinutes;

  async function addSubtopic() {
    if (!form.title_ar.trim()) return;
    setSaving(true);
    await supabase.from('lesson_subtopics').insert({
      plan_id: plan.id,
      order_index: subtopics.length,
      title_ar: form.title_ar,
      title_en: form.title_en,
      duration_minutes: form.duration_minutes,
      content_ar: form.content_ar,
      content_en: form.content_en,
      image_url: form.image_url || null,
    });
    await loadSubtopics();
    setForm(EMPTY_ST);
    setAddingIdx(null);
    setSaving(false);
  }

  async function deleteSubtopic(id: string) {
    await supabase.from('lesson_subtopics').delete().eq('id', id);
    setSubtopics(s => s.filter(x => x.id !== id));
  }

  async function moveUp(idx: number) {
    if (idx === 0) return;
    const a = subtopics[idx], b = subtopics[idx - 1];
    await Promise.all([
      supabase.from('lesson_subtopics').update({ order_index: idx - 1 }).eq('id', a.id),
      supabase.from('lesson_subtopics').update({ order_index: idx }).eq('id', b.id),
    ]);
    await loadSubtopics();
  }

  async function moveDown(idx: number) {
    if (idx === subtopics.length - 1) return;
    const a = subtopics[idx], b = subtopics[idx + 1];
    await Promise.all([
      supabase.from('lesson_subtopics').update({ order_index: idx + 1 }).eq('id', a.id),
      supabase.from('lesson_subtopics').update({ order_index: idx }).eq('id', b.id),
    ]);
    await loadSubtopics();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="p-2 glass rounded-xl text-white/60 hover:text-white transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{lang === 'ar' ? plan.title_ar : plan.title_en}</h1>
          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-primary-400" />
              <span className="text-primary-400 font-semibold">{usedMinutes}</span>
              <span className="text-white/40">/ {plan.total_minutes} {lang === 'ar' ? 'دقيقة' : 'min'}</span>
            </div>
            <div className={`text-sm font-medium ${remainingMinutes < 0 ? 'text-red-400' : remainingMinutes === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {remainingMinutes >= 0
                ? `${remainingMinutes} ${lang === 'ar' ? 'دقيقة متبقية' : 'min remaining'}`
                : `${Math.abs(remainingMinutes)} ${lang === 'ar' ? 'دقيقة زيادة' : 'min over'}`}
            </div>
          </div>

          {/* Duration bar */}
          <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden w-64 max-w-full">
            <div
              className={`h-full rounded-full transition-all duration-500 ${remainingMinutes < 0 ? 'bg-red-500' : 'bg-gradient-to-r from-primary-500 to-emerald-500'}`}
              style={{ width: `${Math.min(100, (usedMinutes / plan.total_minutes) * 100)}%` }}
            />
          </div>
        </div>
        <button onClick={() => setAddingIdx(subtopics.length)} className="premium-btn flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" />{t('addSubtopic')}
        </button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 shimmer-bg rounded-2xl" />)}</div>
      ) : subtopics.length === 0 && addingIdx === null ? (
        <div className="glass-card p-12 text-center">
          <BookMarked className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">{lang === 'ar' ? 'لا توجد مواضيع فرعية بعد' : 'No sub-topics yet'}</p>
          <button onClick={() => setAddingIdx(0)} className="mt-4 premium-btn text-sm flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />{t('addSubtopic')}
          </button>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute start-6 top-0 bottom-0 w-0.5 bg-white/10 rounded-full" />

          <div className="space-y-4">
            {subtopics.map((st, idx) => (
              <div key={st.id} className="relative flex gap-4">
                {/* Node */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 border-2 border-primary-400/50 flex items-center justify-center text-white font-bold text-sm shadow-glow shrink-0">
                    {idx + 1}
                  </div>
                  <div className="text-primary-400 text-xs mt-1 font-mono">{st.duration_minutes}m</div>
                </div>

                {/* Card */}
                <div className="flex-1 glass-card p-4 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white">{lang === 'ar' ? st.title_ar : (st.title_en || st.title_ar)}</h4>
                      {st.content_ar && (
                        <p className="text-white/60 text-sm mt-1 leading-relaxed line-clamp-3">
                          {lang === 'ar' ? st.content_ar : (st.content_en || st.content_ar)}
                        </p>
                      )}
                      {st.image_url && (
                        <img src={st.image_url} className="mt-2 rounded-lg max-h-40 object-contain border border-white/10" alt="" />
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0}
                        className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-30 transition-colors">
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveDown(idx)} disabled={idx === subtopics.length - 1}
                        className="p-1 rounded text-white/20 hover:text-white/60 disabled:opacity-30 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteSubtopic(st.id)}
                        className="p-1 rounded text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add form inline */}
            {addingIdx !== null && (
              <div className="relative flex gap-4 animate-slide-up">
                <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-dashed border-white/25 flex items-center justify-center text-white/40 shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <div className="flex-1 glass-card p-5 space-y-4">
                  <h4 className="font-semibold text-white text-sm">{t('addSubtopic')}</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">{t('subtopicTitle')} (AR) *</label>
                      <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })}
                        className="input-field text-sm py-2" placeholder={lang === 'ar' ? 'عنوان الموضوع' : 'Topic title'} />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">{t('subtopicTitle')} (EN)</label>
                      <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })}
                        className="input-field text-sm py-2" placeholder="Topic title in English" />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">{t('subtopicDuration')}</label>
                      <input type="number" min={1} max={remainingMinutes > 0 ? remainingMinutes : 60}
                        value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: +e.target.value })}
                        className="input-field text-sm py-2" />
                    </div>
                    <div>
                      <label className="text-white/40 text-xs mb-1 block">
                        {t('subtopicImage')} <span className="text-white/20">(URL)</span>
                      </label>
                      <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })}
                        className="input-field text-sm py-2" placeholder="https://..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-white/40 text-xs mb-1 block">{t('subtopicContent')} (AR)</label>
                      <textarea value={form.content_ar} onChange={e => setForm({ ...form, content_ar: e.target.value })}
                        className="input-field text-sm" rows={3}
                        placeholder={lang === 'ar' ? 'المحتوى النصي من الكتاب المدرسي...' : 'Text content from the textbook...'} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-white/40 text-xs mb-1 block">{t('subtopicContent')} (EN)</label>
                      <textarea value={form.content_en} onChange={e => setForm({ ...form, content_en: e.target.value })}
                        className="input-field text-sm" rows={2} placeholder="English content (optional)" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addSubtopic} disabled={saving || !form.title_ar.trim()} className="premium-btn text-sm">
                      {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('save')}
                    </button>
                    <button onClick={() => { setAddingIdx(null); setForm(EMPTY_ST); }} className="premium-btn-outline text-sm">{t('cancel')}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
