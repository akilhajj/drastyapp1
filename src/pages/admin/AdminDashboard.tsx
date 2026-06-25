import React, { useEffect, useState } from 'react';
import { supabase, Profile, Banner, CurriculumPdf, Subject, TargetAudience } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import SchedulesModule from '../shared/SchedulesModule';
import QuizBuilder from '../shared/QuizBuilder';
import QuestionBank from '../shared/QuestionBank';
import LessonPlannerModule from '../shared/LessonPlannerModule';
import PreferencesPanel from './PreferencesPanel';
import {
  Users, GraduationCap, Ticket, Check, X, Plus,
  BarChart3, AlertCircle, Send, Eye, Trash2, RefreshCw
} from 'lucide-react';

interface AdminDashboardProps { activeTab: string }

export default function AdminDashboard({ activeTab }: AdminDashboardProps) {
  return (
    <div className="animate-fade-in">
      {activeTab === 'dashboard'    && <AdminOverview />}
      {activeTab === 'students'     && <AdminStudents />}
      {activeTab === 'teachers'     && <AdminTeachers />}
      {activeTab === 'curriculum'   && <AdminCurriculum />}
      {activeTab === 'subjects'     && <AdminSubjects />}
      {activeTab === 'banners'      && <AdminBanners />}
      {activeTab === 'notifications'&& <AdminNotifications />}
      {activeTab === 'reports'      && <AdminReports />}
      {activeTab === 'schedules'    && <SchedulesModule />}
      {activeTab === 'quizBuilder'  && <QuizBuilder />}
      {activeTab === 'questionBank' && <QuestionBank />}
      {activeTab === 'lessonPlanner'&& <LessonPlannerModule />}
      {activeTab === 'preferences'  && <PreferencesPanel />}
    </div>
  );
}

// ─── Demo data (shown when Supabase has no real auth users) ──────────────────
const DEMO_STUDENTS: Profile[] = [
  { id: 'd1', role: 'student', full_name: 'سارة إبراهيم',  email: 'sara@student.edu',     phone: '', language: 'ar', status: 'active',   religion_enabled: true,  religion_prompt_shown: true,  specialization: 'bac_science',  created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd2', role: 'student', full_name: 'محمد خالد',      email: 'mohammed@student.edu', phone: '', language: 'ar', status: 'active',   religion_enabled: false, religion_prompt_shown: false, specialization: 'grade_9',      created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd3', role: 'student', full_name: 'لينا يوسف',      email: 'lina@student.edu',     phone: '', language: 'ar', status: 'pending',  religion_enabled: true,  religion_prompt_shown: false, specialization: 'bac_literary', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd4', role: 'student', full_name: 'أحمد سعد',       email: 'ahmad@student.edu',    phone: '', language: 'ar', status: 'pending',  religion_enabled: false, religion_prompt_shown: false, specialization: 'bac_science',  created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'd5', role: 'student', full_name: 'ريم الحسين',     email: 'reem@student.edu',     phone: '', language: 'ar', status: 'rejected', religion_enabled: false, religion_prompt_shown: false, specialization: 'grade_9',      created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
const DEMO_TEACHERS: Profile[] = [
  { id: 't1', role: 'teacher', full_name: 'أحمد الرشيد', email: 'teacher@institute.edu', phone: '', language: 'ar', status: 'active', religion_enabled: false, religion_prompt_shown: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 't2', role: 'teacher', full_name: 'نور الدين',   email: 'nour@institute.edu',    phone: '', language: 'ar', status: 'active', religion_enabled: false, religion_prompt_shown: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
const SPEC_LABEL: Record<string, { ar: string; en: string }> = {
  grade_9:      { ar: 'تاسع أساسي',    en: 'Grade 9' },
  bac_science:  { ar: 'بكالوريا علمي', en: 'Bac Sci' },
  bac_literary: { ar: 'بكالوريا أدبي', en: 'Bac Lit' },
};

// ─── Overview ────────────────────────────────────────────────────────────────
function AdminOverview() {
  const { t } = useLang();
  const [stats, setStats] = useState({ students: 0, teachers: 0, pending: 0, openTickets: 0, closedTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [a, b, c, d, e] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
      ]);
      // Fall back to demo counts if Supabase has no real users
      setStats({
        students:     (a.count || 0) || DEMO_STUDENTS.filter(s => s.status === 'active').length,
        teachers:     (b.count || 0) || DEMO_TEACHERS.length,
        pending:      (c.count || 0) || DEMO_STUDENTS.filter(s => s.status === 'pending').length,
        openTickets:  d.count || 0,
        closedTickets:e.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: t('activeStudents'),  value: stats.students,      icon: Users,         color: 'from-primary-600 to-primary-800', glow: 'rgba(37,99,235,0.4)' },
    { label: t('totalTeachers'),   value: stats.teachers,      icon: GraduationCap, color: 'from-emerald-600 to-emerald-800', glow: 'rgba(5,150,105,0.4)' },
    { label: t('pendingStudents'), value: stats.pending,       icon: AlertCircle,   color: 'from-amber-600 to-amber-800',     glow: 'rgba(217,119,6,0.4)' },
    { label: t('openTickets'),     value: stats.openTickets,   icon: Ticket,        color: 'from-red-600 to-red-800',         glow: 'rgba(220,38,38,0.4)' },
    { label: t('closedTickets'),   value: stats.closedTickets, icon: Check,         color: 'from-teal-600 to-teal-800',       glow: 'rgba(13,148,136,0.4)' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card p-5 hover:scale-105 transition-all duration-300" style={{ boxShadow: `0 4px 30px ${c.glow}` }}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">
                {loading ? <div className="h-7 w-12 shimmer-bg rounded" /> : c.value}
              </div>
              <div className="text-white/50 text-xs mt-0.5">{c.label}</div>
            </div>
          );
        })}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentPendingStudents />
        <RecentTickets />
      </div>
    </div>
  );
}

function RecentPendingStudents() {
  const { t } = useLang();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(5);
    setStudents((data && data.length > 0) ? data : DEMO_STUDENTS.filter(s => s.status === 'pending'));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="glass-card p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400" />{t('pendingStudents')}
      </h3>
      {loading
        ? [...Array(3)].map((_, i) => <div key={i} className="h-10 shimmer-bg rounded-lg mb-2" />)
        : students.length === 0
          ? <p className="text-white/30 text-sm text-center py-6">{t('noData')}</p>
          : students.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {s.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{s.full_name}</div>
                  <div className="text-xs text-white/40 truncate">{s.email}</div>
                </div>
                <div className="flex gap-1">
                  {s.payment_receipt_url && (
                    <a href={s.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30">
                      <Eye className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button onClick={async () => { await supabase.from('profiles').update({ status: 'active' }).eq('id', s.id); load(); }} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { await supabase.from('profiles').update({ status: 'rejected' }).eq('id', s.id); load(); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))
      }
    </div>
  );
}

function RecentTickets() {
  const { t, lang } = useLang();
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('help_tickets').select('*, profiles!help_tickets_student_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5).then(({ data }) => setTickets(data || []));
  }, []);
  const badge = { open: 'badge-danger', in_progress: 'badge-warning', closed: 'badge-success' } as const;
  const label = { open: t('ticketOpen'), in_progress: t('ticketInProgress'), closed: t('ticketClosed') } as const;
  return (
    <div className="glass-card p-5">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Ticket className="w-4 h-4 text-primary-400" />{t('tickets')}</h3>
      {tickets.length === 0
        ? <p className="text-white/30 text-sm text-center py-6">{t('noData')}</p>
        : tickets.map(tk => (
            <div key={tk.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{tk.title}</div>
                <div className="text-xs text-white/40">{tk.profiles?.full_name}</div>
              </div>
              <span className={badge[tk.status as keyof typeof badge]}>{label[tk.status as keyof typeof label]}</span>
            </div>
          ))
      }
    </div>
  );
}

// ─── Students ────────────────────────────────────────────────────────────────
function AdminStudents() {
  const { t, lang } = useLang();
  const [students, setStudents] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let q = supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    const list = (data && data.length > 0) ? data : DEMO_STUDENTS;
    setStudents(filter === 'all' ? list : list.filter(s => s.status === filter));
    setLoading(false);
  }
  useEffect(() => { load(); }, [filter]);

  const FILTERS = ['all', 'pending', 'active', 'rejected'] as const;
  const filterLabel = { all: t('all'), pending: t('pendingApproval'), active: t('active'), rejected: lang === 'ar' ? 'مرفوض' : 'Rejected' };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('students')}</h1>
        <button onClick={load} className="p-2 glass rounded-xl text-white/60 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-primary-600 text-white' : 'glass text-white/60 hover:text-white'}`}>
            {filterLabel[f]}
          </button>
        ))}
      </div>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {[t('fullName'), t('email'), t('specialization'), t('status'), t('enableReligion'), t('actions')].map(h => (
                  <th key={h} className="text-start py-3 px-4 text-white/50 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <tr key={i} className="border-b border-white/5">{[...Array(6)].map((_, j) => <td key={j} className="py-3 px-4"><div className="h-5 shimmer-bg rounded" /></td>)}</tr>)
                : students.length === 0
                  ? <tr><td colSpan={6} className="text-center py-10 text-white/30">{t('noData')}</td></tr>
                  : students.map(s => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">{s.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <span className="text-sm text-white font-medium">{s.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/60 text-sm">{s.email}</td>
                        <td className="py-3 px-4">
                          {s.specialization && <span className="badge badge-info text-xs">{lang === 'ar' ? SPEC_LABEL[s.specialization]?.ar : SPEC_LABEL[s.specialization]?.en}</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={s.status === 'active' ? 'badge-success' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}>
                            {s.status === 'active' ? t('active') : s.status === 'pending' ? t('pendingApproval') : (lang === 'ar' ? 'مرفوض' : 'Rejected')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button onClick={async () => { await supabase.from('profiles').update({ religion_enabled: !s.religion_enabled }).eq('id', s.id); load(); }}
                            className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${s.religion_enabled ? 'bg-emerald-500' : 'bg-white/20'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${s.religion_enabled ? (lang === 'ar' ? 'right-0.5' : 'left-4') : (lang === 'ar' ? 'right-4' : 'left-0.5')}`} />
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            {s.payment_receipt_url && <a href={s.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"><Eye className="w-3.5 h-3.5" /></a>}
                            {s.status !== 'active'   && <button onClick={async () => { await supabase.from('profiles').update({ status: 'active' }).eq('id', s.id); load(); }} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>}
                            {s.status !== 'rejected' && <button onClick={async () => { await supabase.from('profiles').update({ status: 'rejected' }).eq('id', s.id); load(); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><X className="w-3.5 h-3.5" /></button>}
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Teachers ────────────────────────────────────────────────────────────────
function AdminTeachers() {
  const { t } = useLang();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Record<string, { opened: number; closed: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
      const list = (data && data.length > 0) ? data : DEMO_TEACHERS;
      setTeachers(list);
      const map: Record<string, { opened: number; closed: number }> = {};
      await Promise.all(list.map(async tc => {
        const [o, c] = await Promise.all([
          supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('assigned_teacher_id', tc.id),
          supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('closed_by', tc.id).eq('status', 'closed'),
        ]);
        map[tc.id] = { opened: o.count || 0, closed: c.count || 0 };
      }));
      setStats(map);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('teachers')}</h1>
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {[t('fullName'), t('email'), t('totalOpened'), t('totalClosed')].map(h => (
                  <th key={h} className="text-start py-3 px-4 text-white/50 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(3)].map((_, i) => <tr key={i} className="border-b border-white/5">{[...Array(4)].map((_, j) => <td key={j} className="py-3 px-4"><div className="h-5 shimmer-bg rounded" /></td>)}</tr>)
                : teachers.length === 0
                  ? <tr><td colSpan={4} className="text-center py-10 text-white/30">{t('noData')}</td></tr>
                  : teachers.map(tc => (
                      <tr key={tc.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">{tc.full_name?.charAt(0)?.toUpperCase() || 'T'}</div>
                            <span className="text-sm text-white font-medium">{tc.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/60 text-sm">{tc.email}</td>
                        <td className="py-3 px-4"><span className="badge badge-warning">{stats[tc.id]?.opened ?? 0}</span></td>
                        <td className="py-3 px-4"><span className="badge badge-success">{stats[tc.id]?.closed ?? 0}</span></td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Curriculum PDFs ──────────────────────────────────────────────────────────
function AdminCurriculum() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pdfs, setPdfs] = useState<CurriculumPdf[]>([]);
  const [form, setForm] = useState({ subject_id: '', title_ar: '', title_en: '', file_url: '', version: '' });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('subjects').select('*').eq('is_active', true).order('order_index').then(({ data }) => setSubjects(data || []));
    supabase.from('curriculum_pdfs').select('*').order('created_at', { ascending: false }).then(({ data }) => setPdfs(data || []));
  }, []);

  async function save() {
    if (!form.subject_id || !form.title_ar || !form.file_url) return;
    setSaving(true);
    await supabase.from('curriculum_pdfs').insert({ ...form, uploaded_by: user?.id });
    const { data } = await supabase.from('curriculum_pdfs').select('*').order('created_at', { ascending: false });
    setPdfs(data || []);
    setForm({ subject_id: '', title_ar: '', title_en: '', file_url: '', version: '' });
    setAdding(false);
    setSaving(false);
  }

  const subName = (id: string) => { const s = subjects.find(x => x.id === id); return s ? (lang === 'ar' ? s.name_ar : s.name_en) : ''; };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('curriculum')}</h1>
        <button onClick={() => setAdding(!adding)} className="premium-btn flex items-center gap-2"><Plus className="w-4 h-4" />{t('add')}</button>
      </div>
      {adding && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{t('subjects')}</label>
              <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} className="input-field">
                <option value="">{lang === 'ar' ? '-- اختر --' : '-- Select --'}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{lang === 'ar' ? s.name_ar : s.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الإصدار' : 'Version'}</label>
              <input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="input-field" placeholder="v1.0" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (عربي)' : 'Title (AR)'}</label>
              <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label>
              <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-1 block">PDF URL</label>
              <input value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} className="input-field" placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="premium-btn">{t('save')}</button>
            <button onClick={() => setAdding(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {[t('subjects'), lang === 'ar' ? 'العنوان' : 'Title', lang === 'ar' ? 'الإصدار' : 'Version', t('actions')].map(h => (
                <th key={h} className="text-start py-3 px-4 text-white/50 text-xs font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pdfs.length === 0
              ? <tr><td colSpan={4} className="text-center py-10 text-white/30">{t('noData')}</td></tr>
              : pdfs.map(pdf => (
                  <tr key={pdf.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 text-sm text-white/70">{subName(pdf.subject_id)}</td>
                    <td className="py-3 px-4 text-sm text-white">{lang === 'ar' ? pdf.title_ar : pdf.title_en}</td>
                    <td className="py-3 px-4"><span className="badge badge-info">{pdf.version || 'N/A'}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <a href={pdf.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30"><Eye className="w-3.5 h-3.5" /></a>
                        <button onClick={async () => { await supabase.from('curriculum_pdfs').delete().eq('id', pdf.id); setPdfs(p => p.filter(x => x.id !== pdf.id)); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
const AUDIENCE_OPTIONS: { val: TargetAudience; ar: string; en: string }[] = [
  { val: 'grade_9',      ar: 'تاسع أساسي',    en: 'Grade 9 Basic' },
  { val: 'bac_science',  ar: 'بكالوريا علمي', en: 'Bac Science' },
  { val: 'bac_literary', ar: 'بكالوريا أدبي', en: 'Bac Literary' },
];

function AdminSubjects() {
  const { t, lang } = useLang();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name_ar: '', name_en: '', description_ar: '', color_from: '#3b82f6', color_to: '#1d4ed8',
    icon: '📚', is_religion: false, target_audience: [] as TargetAudience[],
  });

  async function load() {
    supabase.from('subjects').select('*').order('order_index').then(({ data }) => setSubjects(data || []));
  }
  useEffect(() => { load(); }, []);

  function toggleAudience(val: TargetAudience) {
    setForm(f => ({
      ...f,
      target_audience: f.target_audience.includes(val) ? f.target_audience.filter(a => a !== val) : [...f.target_audience, val],
    }));
  }

  async function createSubject() {
    if (!form.name_ar.trim()) return;
    setSaving(true);
    const audience = form.target_audience.length ? form.target_audience : ['grade_9', 'bac_science', 'bac_literary'];
    const maxOrder = subjects.reduce((m, s) => Math.max(m, s.order_index), 0);
    await supabase.from('subjects').insert({
      name_ar: form.name_ar, name_en: form.name_en || form.name_ar,
      description_ar: form.description_ar || null, description_en: null,
      color_from: form.color_from, color_to: form.color_to,
      icon: form.icon, is_religion: form.is_religion,
      is_active: true, order_index: maxOrder + 1,
      target_audience: audience,
    });
    await load();
    setForm({ name_ar: '', name_en: '', description_ar: '', color_from: '#3b82f6', color_to: '#1d4ed8', icon: '📚', is_religion: false, target_audience: [] });
    setCreating(false);
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('subjects')}</h1>
        <button onClick={() => setCreating(!creating)} className="premium-btn flex items-center gap-2">
          <Plus className="w-4 h-4" />{lang === 'ar' ? 'إضافة مادة جديدة' : 'Create New Subject'}
        </button>
      </div>

      {creating && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <h3 className="font-bold text-white">{lang === 'ar' ? 'مادة دراسية جديدة' : 'New Subject'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'اسم المادة (عربي)' : 'Subject Name (AR)'} *</label>
              <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="input-field" placeholder={lang === 'ar' ? 'مثال: الرياضيات' : 'e.g. Mathematics'} />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'اسم المادة (إنجليزي)' : 'Subject Name (EN)'}</label>
              <input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} className="input-field" placeholder="e.g. Mathematics" />
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'لون البداية' : 'Color From'}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color_from} onChange={e => setForm({ ...form, color_from: e.target.value })} className="w-10 h-10 rounded-lg border border-white/15 bg-transparent cursor-pointer" />
                <input value={form.color_from} onChange={e => setForm({ ...form, color_from: e.target.value })} className="input-field flex-1 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'لون النهاية' : 'Color To'}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color_to} onChange={e => setForm({ ...form, color_to: e.target.value })} className="w-10 h-10 rounded-lg border border-white/15 bg-transparent cursor-pointer" />
                <input value={form.color_to} onChange={e => setForm({ ...form, color_to: e.target.value })} className="input-field flex-1 font-mono text-sm" />
              </div>
            </div>
            <div>
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'أيقونة' : 'Icon'}</label>
              <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="input-field text-2xl" maxLength={2} />
            </div>
            <div className="flex items-center gap-3 self-end pb-1">
              <button type="button" onClick={() => setForm(f => ({ ...f, is_religion: !f.is_religion }))}
                className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${form.is_religion ? 'bg-emerald-500' : 'bg-white/20'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_religion ? 'left-5' : 'left-0.5'}`} />
              </button>
              <span className="text-white/60 text-sm">{t('enableReligion')}</span>
            </div>
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-2 block">{t('targetAudience')}</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_OPTIONS.map(opt => (
                  <button key={opt.val} type="button" onClick={() => toggleAudience(opt.val)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all ${
                      form.target_audience.includes(opt.val)
                        ? 'bg-primary-600/30 border-primary-500/50 text-white'
                        : 'border-white/15 text-white/50 hover:border-white/30 hover:text-white'
                    }`}>
                    {form.target_audience.includes(opt.val) && <Check className="w-3.5 h-3.5" />}
                    {lang === 'ar' ? opt.ar : opt.en}
                  </button>
                ))}
                {form.target_audience.length === 0 && <span className="text-white/25 text-xs self-center">{lang === 'ar' ? '(سيظهر للجميع)' : '(shown to all)'}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createSubject} disabled={saving || !form.name_ar.trim()} className="premium-btn flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check className="w-4 h-4" />{t('save')}</>}
            </button>
            <button onClick={() => setCreating(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.length === 0
          ? <p className="col-span-3 text-center py-10 text-white/30">{t('noData')}</p>
          : subjects.map(sub => (
              <div key={sub.id} className="glass-card p-5 relative overflow-hidden hover:scale-[1.02] transition-all duration-300">
                <div className="absolute inset-0 opacity-20 rounded-2xl" style={{ background: `linear-gradient(135deg,${sub.color_from},${sub.color_to})` }} />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl mb-1">{sub.icon}</div>
                    <div className="font-bold text-white">{lang === 'ar' ? sub.name_ar : sub.name_en}</div>
                    <div className="text-white/50 text-xs mt-0.5">{lang === 'ar' ? sub.name_en : sub.name_ar}</div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {sub.is_religion && <span className="badge badge-info">{lang === 'ar' ? 'دين' : 'Religion'}</span>}
                      {sub.target_audience?.map((a: string) => (
                        <span key={a} className="text-xs text-white/30 bg-white/8 px-2 py-0.5 rounded-full">
                          {lang === 'ar' ? SPEC_LABEL[a]?.ar : SPEC_LABEL[a]?.en}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={async () => { await supabase.from('subjects').update({ is_active: !sub.is_active }).eq('id', sub.id); setSubjects(s => s.map(x => x.id === sub.id ? { ...x, is_active: !sub.is_active } : x)); }}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0 ${sub.is_active ? 'bg-emerald-500' : 'bg-white/20'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${sub.is_active ? (lang === 'ar' ? 'right-0.5' : 'left-4') : (lang === 'ar' ? 'right-4' : 'left-0.5')}`} />
                  </button>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── Banners ──────────────────────────────────────────────────────────────────
function AdminBanners() {
  const { t, lang } = useLang();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [form, setForm] = useState({ title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '', order_index: 1 });
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() { const { data } = await supabase.from('banners').select('*').order('order_index'); setBanners(data || []); }
  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    await supabase.from('banners').insert({ ...form, is_active: true });
    await load();
    setForm({ title_ar: '', title_en: '', subtitle_ar: '', subtitle_en: '', image_url: '', order_index: 1 });
    setAdding(false);
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('banners')}</h1>
        <button onClick={() => setAdding(!adding)} className="premium-btn flex items-center gap-2"><Plus className="w-4 h-4" />{t('add')}</button>
      </div>
      {adding && (
        <div className="glass-card p-5 animate-slide-up space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {[['title_ar', lang === 'ar' ? 'العنوان (عربي)' : 'Title (AR)'], ['title_en', lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (EN)'],
              ['subtitle_ar', lang === 'ar' ? 'الوصف (عربي)' : 'Subtitle (AR)'], ['subtitle_en', lang === 'ar' ? 'الوصف (إنجليزي)' : 'Subtitle (EN)']].map(([key, label]) => (
              <div key={key}>
                <label className="text-white/50 text-sm mb-1 block">{label}</label>
                <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="input-field" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'رابط الصورة' : 'Image URL'}</label>
              <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} className="input-field" placeholder="https://images.pexels.com/..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving} className="premium-btn">{t('save')}</button>
            <button onClick={() => setAdding(false)} className="premium-btn-outline">{t('cancel')}</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {banners.length === 0
          ? <div className="glass-card p-10 text-center text-white/30">{t('noData')}</div>
          : banners.map(b => (
              <div key={b.id} className="glass-card p-4 flex items-center gap-4">
                {b.image_url && <img src={b.image_url} className="w-16 h-12 object-cover rounded-lg shrink-0" alt="" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white">{lang === 'ar' ? b.title_ar : b.title_en}</div>
                  <div className="text-white/40 text-sm truncate">{lang === 'ar' ? b.subtitle_ar : b.subtitle_en}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <button onClick={async () => { await supabase.from('banners').update({ is_active: !b.is_active }).eq('id', b.id); setBanners(x => x.map(y => y.id === b.id ? { ...y, is_active: !b.is_active } : y)); }}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${b.is_active ? 'bg-emerald-500' : 'bg-white/20'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${b.is_active ? (lang === 'ar' ? 'right-0.5' : 'left-4') : (lang === 'ar' ? 'right-4' : 'left-0.5')}`} />
                  </button>
                  <button onClick={async () => { await supabase.from('banners').delete().eq('id', b.id); setBanners(x => x.filter(y => y.id !== b.id)); }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))
        }
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────
function AdminNotifications() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const [form, setForm] = useState({ title_ar: '', title_en: '', body_ar: '', body_en: '', type: 'info' as const });
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);

  async function load() { const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20); setNotifs(data || []); }
  useEffect(() => { load(); }, []);

  async function send() {
    if (!form.title_ar || !form.body_ar) return;
    setSending(true);
    await supabase.from('notifications').insert({ ...form, is_global: true, sender_id: user?.id });
    setOk(true); setTimeout(() => setOk(false), 3000);
    setForm({ title_ar: '', title_en: '', body_ar: '', body_en: '', type: 'info' });
    setSending(false);
    load();
  }

  const typeBadge = { info: 'badge-info', success: 'badge-success', warning: 'badge-warning', alert: 'badge-danger' } as const;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('notifications')}</h1>
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-bold text-white flex items-center gap-2"><Send className="w-4 h-4 text-primary-400" />{t('globalNotification')}</h3>
        {ok && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">{t('success')}!</div>}
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (عربي)' : 'Title (AR)'}</label><input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="input-field" /></div>
          <div><label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label><input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input-field" /></div>
          <div><label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الرسالة (عربي)' : 'Message (AR)'}</label><textarea value={form.body_ar} onChange={e => setForm({ ...form, body_ar: e.target.value })} className="input-field" rows={2} /></div>
          <div><label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'الرسالة (إنجليزي)' : 'Message (EN)'}</label><textarea value={form.body_en} onChange={e => setForm({ ...form, body_en: e.target.value })} className="input-field" rows={2} /></div>
          <div>
            <label className="text-white/50 text-sm mb-1 block">{lang === 'ar' ? 'النوع' : 'Type'}</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="input-field">
              {['info', 'success', 'warning', 'alert'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <button onClick={send} disabled={sending} className="premium-btn flex items-center gap-2">
          <Send className="w-4 h-4" />{t('sendNotification')}
        </button>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold text-white">{lang === 'ar' ? 'الإشعارات المرسلة' : 'Sent Notifications'}</div>
        <div className="divide-y divide-white/5">
          {notifs.length === 0
            ? <p className="p-8 text-center text-white/30">{t('noData')}</p>
            : notifs.map(n => (
                <div key={n.id} className="p-4 hover:bg-white/3 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={typeBadge[n.type as keyof typeof typeBadge]}>{n.type}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{lang === 'ar' ? n.title_ar : n.title_en}</div>
                      <div className="text-white/50 text-xs mt-0.5">{lang === 'ar' ? n.body_ar : n.body_en}</div>
                    </div>
                    <div className="text-white/30 text-xs">{new Date(n.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US')}</div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function AdminReports() {
  const { t, lang } = useLang();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('ai_chat_logs').select('*, profiles!ai_chat_logs_student_id_fkey(full_name)').order('created_at', { ascending: false }).limit(30).then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">{t('reports')}</h1>
      <div className="glass-card p-5">
        <h3 className="font-bold text-white mb-4">{lang === 'ar' ? 'سجلات تفاعل الذكاء الاصطناعي' : 'AI Interaction Logs'}</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0
            ? <p className="text-center text-white/30 py-8">{t('noData')}</p>
            : logs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary-400">{log.profiles?.full_name}</span>
                    <span className={`badge ${log.mode === 'voice' ? 'badge-warning' : 'badge-info'}`}>{log.mode}</span>
                    <span className="badge badge-info">{log.language}</span>
                    <span className="text-white/30 text-xs ms-auto">{new Date(log.created_at).toLocaleString(lang === 'ar' ? 'ar-SY' : 'en-US')}</span>
                  </div>
                  <div className="text-white/70 text-xs"><span className="text-white/40">{lang === 'ar' ? 'السؤال:' : 'Q:'}</span> {log.user_message}</div>
                  <div className="text-white/50 text-xs mt-1 line-clamp-2"><span className="text-white/40">{lang === 'ar' ? 'الإجابة:' : 'A:'}</span> {log.ai_response}</div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
