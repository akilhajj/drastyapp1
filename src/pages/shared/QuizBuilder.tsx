import React, { useEffect, useState } from 'react';
import { supabase, Subject } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import QuestionBank from './QuestionBank';
import {
  Plus, Trash2, ClipboardList, ChevronRight, Check, X,
  Eye, BookOpen, Clock, Target, Database, ArrowLeft
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface QuizQuestion {
  id?: string;
  question_ar: string;
  question_en: string;
  order_index: number;
  points: number;
  options: { text_ar: string; text_en: string; is_correct: boolean }[];
}

interface Quiz {
  id: string;
  lesson_id: string | null;
  subject_id: string | null;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  passing_score: number;
  time_limit_minutes: number;
  is_active: boolean;
}

type View = 'list' | 'create' | 'detail' | 'importBank';

const EMPTY_Q: QuizQuestion = {
  question_ar: '',
  question_en: '',
  order_index: 0,
  points: 1,
  options: [
    { text_ar: '', text_en: '', is_correct: true },
    { text_ar: '', text_en: '', is_correct: false },
    { text_ar: '', text_en: '', is_correct: false },
    { text_ar: '', text_en: '', is_correct: false },
  ],
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function QuizBuilder() {
  const { t, lang } = useLang();
  const [view, setView] = useState<View>('list');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  function handleBack() {
    setView('list');
    setSelectedQuiz(null);
  }

  return (
    <div className="animate-fade-in">
      {view === 'list' && (
        <QuizList
          onCreateNew={() => setView('create')}
          onView={q => { setSelectedQuiz(q); setView('detail'); }}
        />
      )}
      {view === 'create' && (
        <QuizCreate
          onBack={handleBack}
          onCreated={q => { setSelectedQuiz(q); setView('detail'); }}
        />
      )}
      {view === 'detail' && selectedQuiz && (
        <QuizDetail
          quiz={selectedQuiz}
          onBack={handleBack}
          onImportBank={() => setView('importBank')}
        />
      )}
      {view === 'importBank' && selectedQuiz && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('detail')} className="p-2 glass rounded-xl text-white/60 hover:text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-white font-bold">{t('importFromBank')}</h2>
          </div>
          <QuestionBank
            selectable
            onSelect={async (bq) => {
              const { data: existing } = await supabase
                .from('quiz_questions')
                .select('id', { count: 'exact', head: true })
                .eq('quiz_id', selectedQuiz.id);
              const nextIdx = (existing as any)?.count ?? 0;

              const { data: q } = await supabase.from('quiz_questions').insert({
                quiz_id: selectedQuiz.id,
                question_ar: bq.question_ar,
                question_en: bq.question_en,
                order_index: nextIdx,
                points: 1,
              }).select().maybeSingle();

              if (q) {
                await supabase.from('quiz_options').insert(
                  bq.options.map((o: any, i: number) => ({
                    question_id: q.id,
                    option_text_ar: o.text_ar,
                    option_text_en: o.text_en,
                    is_correct: o.is_correct,
                    order_index: i,
                  }))
                );
              }
              setView('detail');
            }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Quiz list ────────────────────────────────────────────────────────────────
function QuizList({ onCreateNew, onView }: {
  onCreateNew: () => void;
  onView: (q: Quiz) => void;
}) {
  const { t, lang } = useLang();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });
      const qs = data || [];
      setQuizzes(qs);

      // Fetch question counts in one batch
      const counts: Record<string, number> = {};
      await Promise.all(qs.map(async q => {
        const { count } = await supabase
          .from('quiz_questions')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', q.id);
        counts[q.id] = count || 0;
      }));
      setQuestionCounts(counts);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('quizzes').update({ is_active: !current }).eq('id', id);
    setQuizzes(q => q.map(x => x.id === id ? { ...x, is_active: !current } : x));
  }

  async function deleteQuiz(id: string) {
    await supabase.from('quizzes').delete().eq('id', id);
    setQuizzes(q => q.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-400" />
            {t('quizBuilder')}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{quizzes.length} {lang === 'ar' ? 'اختبار' : 'quizzes'}</p>
        </div>
        <button onClick={onCreateNew} className="premium-btn flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('createQuiz')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 shimmer-bg rounded-2xl" />)}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ClipboardList className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/30">{t('noData')}</p>
          <p className="text-white/20 text-sm mt-1">{lang === 'ar' ? 'أنشئ أول اختبار' : 'Create your first quiz'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {quizzes.map(q => (
            <div key={q.id} className="glass-card p-5 group hover:border-white/25 hover:scale-[1.01] transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{lang === 'ar' ? q.title_ar : q.title_en}</h3>
                  {q.description_ar && (
                    <p className="text-white/40 text-xs mt-0.5 line-clamp-2">
                      {lang === 'ar' ? q.description_ar : q.description_en}
                    </p>
                  )}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleActive(q.id, q.is_active); }}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ms-3 ${q.is_active ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${q.is_active ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1 text-white/40 text-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                  {questionCounts[q.id] ?? 0} {lang === 'ar' ? 'سؤال' : 'Qs'}
                </div>
                <div className="flex items-center gap-1 text-white/40 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  {q.time_limit_minutes} {lang === 'ar' ? 'دقيقة' : 'min'}
                </div>
                <div className="flex items-center gap-1 text-white/40 text-xs">
                  <Target className="w-3.5 h-3.5" />
                  {q.passing_score}%
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => onView(q)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 text-sm transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {lang === 'ar' ? 'إدارة' : 'Manage'}
                </button>
                <button
                  onClick={() => deleteQuiz(q.id)}
                  className="p-2 rounded-xl bg-red-500/0 text-white/20 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
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

// ─── Quiz Create ──────────────────────────────────────────────────────────────
function QuizCreate({ onBack, onCreated }: {
  onBack: () => void;
  onCreated: (q: Quiz) => void;
}) {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    subject_id: '',
    title_ar: '',
    title_en: '',
    description_ar: '',
    description_en: '',
    passing_score: 70,
    time_limit_minutes: 30,
  });

  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).order('order_index')
      .then(({ data }) => setSubjects(data || []));
  }, []);

  async function create() {
    if (!form.title_ar.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from('quizzes').insert({
      ...form,
      subject_id: form.subject_id || null,
      lesson_id: null,
      is_active: true,
    }).select().maybeSingle();
    setSaving(false);
    if (!error && data) onCreated(data as Quiz);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 glass rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-white">{t('createQuiz')}</h1>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('quizTitle')} (AR) *</label>
            <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="input-field" placeholder={lang === 'ar' ? 'عنوان الاختبار بالعربية' : 'Quiz title in Arabic'} />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('quizTitle')} (EN)</label>
            <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input-field" placeholder="Quiz title in English" />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}</label>
            <textarea value={form.description_ar} onChange={e => setForm({ ...form, description_ar: e.target.value })} className="input-field" rows={2} />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}</label>
            <textarea value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} className="input-field" rows={2} />
          </div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{t('subjects')}</label>
            <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="input-field">
              <option value="">{lang === 'ar' ? '-- عام --' : '-- General --'}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('quizDuration')}</label>
              <input type="number" min={5} max={180} value={form.time_limit_minutes} onChange={e => setForm({ ...form, time_limit_minutes: +e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('passingScoreLabel')}</label>
              <input type="number" min={10} max={100} value={form.passing_score} onChange={e => setForm({ ...form, passing_score: +e.target.value })} className="input-field" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={create} disabled={saving || !form.title_ar.trim()} className="premium-btn flex items-center gap-2">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><Check className="w-4 h-4" /> {lang === 'ar' ? 'إنشاء والمتابعة' : 'Create & Continue'}</>}
          </button>
          <button onClick={onBack} className="premium-btn-outline">{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Quiz Detail (manage questions) ──────────────────────────────────────────
function QuizDetail({ quiz, onBack, onImportBank }: {
  quiz: Quiz;
  onBack: () => void;
  onImportBank: () => void;
}) {
  const { t, lang } = useLang();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingQ, setAddingQ] = useState(false);
  const [newQ, setNewQ] = useState<QuizQuestion>({ ...EMPTY_Q });
  const [saving, setSaving] = useState(false);

  async function loadQuestions() {
    const { data: qData } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('quiz_id', quiz.id)
      .order('order_index');
    setQuestions(qData || []);
    setLoading(false);
  }

  useEffect(() => { loadQuestions(); }, [quiz.id]);

  function setCorrect(idx: number) {
    setNewQ(q => ({
      ...q,
      options: q.options.map((o, i) => ({ ...o, is_correct: i === idx })),
    }));
  }

  function updateOption(idx: number, field: string, val: string) {
    setNewQ(q => ({
      ...q,
      options: q.options.map((o, i) => i === idx ? { ...o, [field]: val } : o),
    }));
  }

  async function saveQuestion() {
    if (!newQ.question_ar.trim()) return;
    setSaving(true);
    const { data: q } = await supabase.from('quiz_questions').insert({
      quiz_id: quiz.id,
      question_ar: newQ.question_ar,
      question_en: newQ.question_en,
      order_index: questions.length,
      points: newQ.points,
    }).select().maybeSingle();

    if (q) {
      await supabase.from('quiz_options').insert(
        newQ.options.map((o, i) => ({
          question_id: q.id,
          option_text_ar: o.text_ar,
          option_text_en: o.text_en,
          is_correct: o.is_correct,
          order_index: i,
        }))
      );
    }
    setNewQ({ ...EMPTY_Q });
    setAddingQ(false);
    await loadQuestions();
    setSaving(false);
  }

  async function deleteQuestion(id: string) {
    await supabase.from('quiz_questions').delete().eq('id', id);
    setQuestions(q => q.filter(x => x.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 glass rounded-xl text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{lang === 'ar' ? quiz.title_ar : quiz.title_en}</h1>
          <div className="flex gap-3 mt-1">
            <span className="text-white/40 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />{quiz.time_limit_minutes} {lang === 'ar' ? 'دقيقة' : 'min'}
            </span>
            <span className="text-white/40 text-xs flex items-center gap-1">
              <Target className="w-3 h-3" />{quiz.passing_score}% {lang === 'ar' ? 'للنجاح' : 'to pass'}
            </span>
            <span className="text-white/40 text-xs flex items-center gap-1">
              <BookOpen className="w-3 h-3" />{questions.length} {lang === 'ar' ? 'سؤال' : 'questions'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onImportBank} className="premium-btn-outline flex items-center gap-1.5 text-sm py-2 px-3">
            <Database className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'من البنك' : 'From Bank'}
          </button>
          <button onClick={() => setAddingQ(!addingQ)} className="premium-btn flex items-center gap-1.5 text-sm py-2 px-3">
            <Plus className="w-3.5 h-3.5" />
            {t('addQuestion')}
          </button>
        </div>
      </div>

      {/* Add question form */}
      {addingQ && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <h3 className="font-semibold text-white">{t('addQuestion')}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-white/50 text-xs mb-1 block">{t('questionText')} (AR) *</label>
              <textarea
                value={newQ.question_ar}
                onChange={e => setNewQ({ ...newQ, question_ar: e.target.value })}
                className="input-field" rows={2}
                placeholder={lang === 'ar' ? 'نص السؤال بالعربية' : 'Question in Arabic'}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-xs mb-1 block">{t('questionText')} (EN)</label>
              <textarea
                value={newQ.question_en}
                onChange={e => setNewQ({ ...newQ, question_en: e.target.value })}
                className="input-field" rows={2}
                placeholder="Question in English (optional)"
              />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">{lang === 'ar' ? 'النقاط' : 'Points'}</label>
              <input
                type="number" min={1} max={10}
                value={newQ.points}
                onChange={e => setNewQ({ ...newQ, points: +e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label className="text-white/50 text-xs mb-2 block">
              {lang === 'ar' ? 'الخيارات — اضغط على الدائرة لتحديد الإجابة الصحيحة' : 'Options — click circle to mark correct answer'}
            </label>
            <div className="space-y-2">
              {newQ.options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrect(i)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      o.is_correct ? 'bg-emerald-500 border-emerald-500' : 'border-white/25 hover:border-white/50'
                    }`}
                  >
                    {o.is_correct && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <input
                    value={o.text_ar}
                    onChange={e => updateOption(i, 'text_ar', e.target.value)}
                    className="input-field flex-1 text-sm py-2"
                    placeholder={`${lang === 'ar' ? 'خيار' : 'Option'} ${i + 1} (AR)`}
                  />
                  <input
                    value={o.text_en}
                    onChange={e => updateOption(i, 'text_en', e.target.value)}
                    className="input-field flex-1 text-sm py-2"
                    placeholder={`Option ${i + 1} (EN)`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={saveQuestion} disabled={saving || !newQ.question_ar.trim()} className="premium-btn text-sm">
              {saving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : t('save')}
            </button>
            <button onClick={() => setAddingQ(false)} className="premium-btn-outline text-sm">{t('cancel')}</button>
          </div>
        </div>
      )}

      {/* Questions list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 shimmer-bg rounded-2xl" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <BookOpen className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/30 text-sm">{lang === 'ar' ? 'لا توجد أسئلة بعد' : 'No questions yet'}</p>
          <p className="text-white/20 text-xs mt-1">{lang === 'ar' ? 'أضف سؤالاً أو استورد من البنك' : 'Add a question or import from the bank'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="glass-card p-4 group">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{lang === 'ar' ? q.question_ar : (q.question_en || q.question_ar)}</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-3">
                    {(q.quiz_options || []).map((o: any) => (
                      <div
                        key={o.id}
                        className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                          o.is_correct
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                            : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {o.is_correct && <Check className="w-3 h-3 shrink-0" />}
                        {lang === 'ar' ? o.option_text_ar : (o.option_text_en || o.option_text_ar)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-white/30 text-xs">{q.points} {lang === 'ar' ? 'نقطة' : 'pt'}</div>
                </div>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="p-1.5 rounded-lg text-white/20 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
