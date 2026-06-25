import React, { useEffect, useState } from 'react';
import { supabase, LessonPlan, LessonSubtopic } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import {
  BookMarked, Clock, CheckCircle, Circle, ChevronDown, ChevronUp,
  Users, Lock
} from 'lucide-react';

const SPEC_LABEL: Record<string, { ar: string; en: string }> = {
  grade_9:      { ar: 'تاسع أساسي',    en: 'Grade 9 Basic' },
  bac_science:  { ar: 'بكالوريا علمي', en: 'Bac Science' },
  bac_literary: { ar: 'بكالوريا أدبي', en: 'Bac Literary' },
};

interface SubtopicWithProgress extends LessonSubtopic {
  completed: boolean;
}

interface PlanWithSubtopics extends LessonPlan {
  subtopics: SubtopicWithProgress[];
}

export default function StudentLessonPlans() {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [plans, setPlans] = useState<PlanWithSubtopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  async function load() {
    const { data: planData } = await supabase
      .from('lesson_plans')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    const rawPlans = (planData || []) as LessonPlan[];

    // Filter by student specialization if set
    const filtered = rawPlans.filter(p =>
      !profile?.specialization ||
      !p.target_audience?.length ||
      p.target_audience.includes(profile.specialization as any)
    );

    const withSubs: PlanWithSubtopics[] = await Promise.all(
      filtered.map(async (p) => {
        const { data: stData } = await supabase
          .from('lesson_subtopics')
          .select('*')
          .eq('plan_id', p.id)
          .order('order_index');

        const { data: progData } = await supabase
          .from('student_subtopic_progress')
          .select('subtopic_id, completed')
          .eq('student_id', profile?.id || '');

        const completedSet = new Set(
          (progData || []).filter(x => x.completed).map(x => x.subtopic_id)
        );

        const subtopics: SubtopicWithProgress[] = (stData || []).map(st => ({
          ...(st as LessonSubtopic),
          completed: completedSet.has(st.id),
        }));

        return { ...p, subtopics };
      })
    );

    setPlans(withSubs);
    setLoading(false);
  }

  useEffect(() => { load(); }, [profile?.id]);

  async function markComplete(subtopicId: string, planId: string) {
    setCompleting(subtopicId);
    await supabase.from('student_subtopic_progress')
      .upsert(
        { student_id: profile?.id, subtopic_id: subtopicId, completed: true, completed_at: new Date().toISOString() },
        { onConflict: 'student_id,subtopic_id' }
      );
    // Optimistic update
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      return {
        ...p,
        subtopics: p.subtopics.map(st =>
          st.id === subtopicId ? { ...st, completed: true } : st
        ),
      };
    }));
    setCompleting(null);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 shimmer-bg rounded-2xl" />)}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="glass-card p-14 text-center">
        <BookMarked className="w-14 h-14 text-white/15 mx-auto mb-3" />
        <p className="text-white/40">{t('noData')}</p>
        <p className="text-white/25 text-sm mt-1">
          {lang === 'ar' ? 'لا توجد خطط دروس منشورة بعد' : 'No lesson plans published yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map(plan => {
        const completedCount = plan.subtopics.filter(s => s.completed).length;
        const totalCount = plan.subtopics.length;
        const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const isOpen = expanded === plan.id;

        return (
          <div key={plan.id} className="glass-card overflow-hidden hover:border-white/25 transition-all duration-200">
            {/* Plan header */}
            <button
              className="w-full flex items-center gap-4 p-5 text-start"
              onClick={() => setExpanded(isOpen ? null : plan.id)}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shrink-0 shadow-glow">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">
                  {lang === 'ar' ? plan.title_ar : (plan.title_en || plan.title_ar)}
                </h3>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-white/40 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {plan.total_minutes} {lang === 'ar' ? 'دقيقة' : 'min'}
                  </span>
                  <span className="text-white/40 text-xs flex items-center gap-1">
                    <BookMarked className="w-3 h-3" />
                    {totalCount} {lang === 'ar' ? 'موضوع' : 'topics'}
                  </span>
                  {plan.target_audience?.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Users className="w-3 h-3" />
                      {plan.target_audience.map(a => lang === 'ar' ? SPEC_LABEL[a]?.ar : SPEC_LABEL[a]?.en).join(', ')}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-primary-500 to-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-white/40 shrink-0">{pct}%</span>
                </div>
              </div>
              <div className="text-white/30 shrink-0">
                {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {/* Expanded timeline */}
            {isOpen && (
              <div className="border-t border-white/10 px-5 py-4">
                {plan.subtopics.length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-4">
                    {lang === 'ar' ? 'لا توجد مواضيع بعد' : 'No topics yet'}
                  </p>
                ) : (
                  <div className="relative">
                    <div className="absolute start-5 top-0 bottom-0 w-0.5 bg-white/10 rounded-full" />
                    <div className="space-y-4">
                      {plan.subtopics.map((st, idx) => {
                        const prevDone = idx === 0 || plan.subtopics[idx - 1].completed;
                        const locked = !prevDone && !st.completed;
                        return (
                          <div key={st.id} className="relative flex gap-4">
                            {/* Timeline node */}
                            <div className="relative z-10 flex flex-col items-center shrink-0">
                              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                st.completed
                                  ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                                  : locked
                                    ? 'bg-navy-900 border-white/15'
                                    : 'bg-primary-600/30 border-primary-400/50'
                              }`}>
                                {st.completed
                                  ? <CheckCircle className="w-5 h-5 text-white" />
                                  : locked
                                    ? <Lock className="w-4 h-4 text-white/25" />
                                    : <span className="text-white font-bold text-sm">{idx + 1}</span>}
                              </div>
                              <div className="text-xs text-white/30 mt-0.5 font-mono">{st.duration_minutes}m</div>
                            </div>

                            {/* Content card */}
                            <div className={`flex-1 rounded-2xl border p-4 transition-all duration-200 ${
                              st.completed
                                ? 'bg-emerald-500/5 border-emerald-500/20'
                                : locked
                                  ? 'bg-white/3 border-white/8 opacity-50'
                                  : 'bg-white/5 border-white/15'
                            }`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-semibold text-sm ${st.completed ? 'text-emerald-300' : locked ? 'text-white/30' : 'text-white'}`}>
                                    {lang === 'ar' ? st.title_ar : (st.title_en || st.title_ar)}
                                  </h4>
                                  {!locked && st.content_ar && (
                                    <p className="text-white/55 text-xs mt-1.5 leading-relaxed">
                                      {lang === 'ar' ? st.content_ar : (st.content_en || st.content_ar)}
                                    </p>
                                  )}
                                  {!locked && st.image_url && (
                                    <img
                                      src={st.image_url}
                                      className="mt-2 rounded-lg max-h-48 object-contain border border-white/10"
                                      alt=""
                                    />
                                  )}
                                </div>

                                {!locked && !st.completed && (
                                  <button
                                    onClick={() => markComplete(st.id, plan.id)}
                                    disabled={completing === st.id}
                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-medium transition-colors"
                                  >
                                    {completing === st.id
                                      ? <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                                      : <><CheckCircle className="w-3.5 h-3.5" />{t('markComplete')}</>}
                                  </button>
                                )}
                                {st.completed && (
                                  <span className="badge badge-success shrink-0 text-xs">{t('completed')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
