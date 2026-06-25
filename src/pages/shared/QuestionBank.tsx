import React, { useEffect, useState } from 'react';
import { supabase, Subject } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import { Plus, Trash2, Database, Check, X, Tag } from 'lucide-react';

interface BankQuestion {
  id: string;
  subject_id: string | null;
  question_ar: string;
  question_en: string;
  options: { text_ar: string; text_en: string; is_correct: boolean }[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

interface QuestionBankProps {
  selectable?: boolean;
  onSelect?: (q: BankQuestion) => void;
}

const DIFF_COLOR = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' };

const EMPTY_OPT = { text_ar: '', text_en: '', is_correct: false };

export default function QuestionBank({ selectable = false, onSelect }: QuestionBankProps) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDiff, setFilterDiff] = useState('');

  const [form, setForm] = useState({
    subject_id: '',
    question_ar: '',
    question_en: '',
    difficulty: 'medium' as const,
    tags: '',
    options: [
      { text_ar: '', text_en: '', is_correct: true },
      { text_ar: '', text_en: '', is_correct: false },
      { text_ar: '', text_en: '', is_correct: false },
      { text_ar: '', text_en: '', is_correct: false },
    ],
  });

  async function load() {
    const [qRes, sRes] = await Promise.all([
      supabase.from('question_bank').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').eq('is_active', true).order('order_index'),
    ]);
    setQuestions(qRes.data || []);
    setSubjects(sRes.data || []);
  }

  useEffect(() => { load(); }, []);

  function setCorrect(idx: number) {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => ({ ...o, is_correct: i === idx })),
    }));
  }

  function updateOption(idx: number, field: keyof typeof EMPTY_OPT, val: string | boolean) {
    setForm(f => ({
      ...f,
      options: f.options.map((o, i) => i === idx ? { ...o, [field]: val } : o),
    }));
  }

  function addOption() {
    if (form.options.length >= 6) return;
    setForm(f => ({ ...f, options: [...f.options, { ...EMPTY_OPT }] }));
  }

  function removeOption(idx: number) {
    if (form.options.length <= 2) return;
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  }

  async function save() {
    if (!form.question_ar.trim()) return;
    setSaving(true);
    const tags = form.tags.split(',').map(s => s.trim()).filter(Boolean);
    await supabase.from('question_bank').insert({
      subject_id: form.subject_id || null,
      question_ar: form.question_ar,
      question_en: form.question_en,
      difficulty: form.difficulty,
      tags,
      options: form.options,
      created_by: user?.id,
    });
    await load();
    setForm({
      subject_id: '', question_ar: '', question_en: '', difficulty: 'medium', tags: '',
      options: [
        { text_ar: '', text_en: '', is_correct: true },
        { text_ar: '', text_en: '', is_correct: false },
        { text_ar: '', text_en: '', is_correct: false },
        { text_ar: '', text_en: '', is_correct: false },
      ],
    });
    setAdding(false);
    setSaving(false);
  }

  async function remove(id: string) {
    await supabase.from('question_bank').delete().eq('id', id);
    setQuestions(q => q.filter(x => x.id !== id));
  }

  const filtered = questions.filter(q => {
    if (filterSubject && q.subject_id !== filterSubject) return false;
    if (filterDiff && q.difficulty !== filterDiff) return false;
    return true;
  });

  function subjectName(id: string | null) {
    if (!id) return '—';
    const s = subjects.find(s => s.id === id);
    return s ? (lang === 'ar' ? s.name_ar : s.name_en) : id;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-400" />
            {t('questionBankTitle')}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{filtered.length} {lang === 'ar' ? 'سؤال' : 'questions'}</p>
        </div>
        {!selectable && (
          <button onClick={() => setAdding(!adding)} className="premium-btn flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('addToBank')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="input-field w-auto text-sm py-1.5 px-3"
        >
          <option value="">{t('all')}</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>)}
        </select>
        <select
          value={filterDiff}
          onChange={e => setFilterDiff(e.target.value)}
          className="input-field w-auto text-sm py-1.5 px-3"
        >
          <option value="">{t('all')}</option>
          <option value="easy">{t('easy')}</option>
          <option value="medium">{t('medium')}</option>
          <option value="hard">{t('hard')}</option>
        </select>
      </div>

      {/* Add form */}
      {adding && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <h3 className="font-bold text-white">{t('addToBank')}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('subjects')}</label>
              <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="input-field">
                <option value="">{lang === 'ar' ? '-- عام --' : '-- General --'}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('difficulty')}</label>
              <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value as any })} className="input-field">
                <option value="easy">{t('easy')}</option>
                <option value="medium">{t('medium')}</option>
                <option value="hard">{t('hard')}</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-1 block">{t('questionText')} ({lang === 'ar' ? 'عربي' : 'Arabic'})</label>
              <textarea
                value={form.question_ar}
                onChange={e => setForm({ ...form, question_ar: e.target.value })}
                className="input-field" rows={2} placeholder={lang === 'ar' ? 'أدخل نص السؤال بالعربية...' : 'Enter question in Arabic...'}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-1 block">{t('questionText')} ({lang === 'ar' ? 'إنجليزي' : 'English'}) <span className="text-white/20">{lang === 'ar' ? '(اختياري)' : '(optional)'}</span></label>
              <textarea
                value={form.question_en}
                onChange={e => setForm({ ...form, question_en: e.target.value })}
                className="input-field" rows={2} placeholder="Enter question in English..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-1 block">{t('tags')} <span className="text-white/20">{lang === 'ar' ? '(مفصولة بفاصلة)' : '(comma-separated)'}</span></label>
              <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="input-field" placeholder="biology, cell, chapter-1" />
            </div>
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-white/50 text-sm">{lang === 'ar' ? 'الخيارات (اضغط ✓ للإجابة الصحيحة)' : 'Options (tap ✓ for correct answer)'}</label>
              <button onClick={addOption} className="text-xs text-primary-400 hover:text-primary-300">+ {t('addOption')}</button>
            </div>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrect(i)}
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      opt.is_correct
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-white/20 text-white/30 hover:border-white/40'
                    }`}
                  >
                    {opt.is_correct && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <input
                    value={opt.text_ar}
                    onChange={e => updateOption(i, 'text_ar', e.target.value)}
                    className="input-field flex-1 text-sm py-2"
                    placeholder={`${lang === 'ar' ? 'الخيار' : 'Option'} ${i + 1} (AR)`}
                  />
                  <input
                    value={opt.text_en}
                    onChange={e => updateOption(i, 'text_en', e.target.value)}
                    className="input-field flex-1 text-sm py-2"
                    placeholder={`Option ${i + 1} (EN)`}
                  />
                  {form.options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="text-red-400/50 hover:text-red-400 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.question_ar.trim()} className="premium-btn">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('save')}
            </button>
            <button onClick={() => setAdding(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* Questions list */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Database className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">{t('noData')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => (
            <div
              key={q.id}
              className={`glass-card p-4 transition-all ${selectable ? 'cursor-pointer hover:border-primary-500/40 hover:scale-[1.005]' : ''}`}
              onClick={() => selectable && onSelect?.(q)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm leading-relaxed">
                    {lang === 'ar' ? q.question_ar : (q.question_en || q.question_ar)}
                  </p>
                  {/* Options preview */}
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {q.options.map((o: any, i: number) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                          o.is_correct
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 text-white/50'
                        }`}
                      >
                        {o.is_correct && <Check className="w-3 h-3 shrink-0" />}
                        {lang === 'ar' ? o.text_ar : (o.text_en || o.text_ar)}
                      </div>
                    ))}
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={DIFF_COLOR[q.difficulty]}>{t(q.difficulty)}</span>
                    {q.subject_id && (
                      <span className="badge badge-info">{subjectName(q.subject_id)}</span>
                    )}
                    {q.tags?.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                </div>
                {!selectable && (
                  <button
                    onClick={e => { e.stopPropagation(); remove(q.id); }}
                    className="p-1.5 rounded-lg text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {selectable && (
                  <div className="w-6 h-6 rounded-full border-2 border-primary-500/50 flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5 text-primary-400" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
