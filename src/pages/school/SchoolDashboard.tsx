import React, { useState, useEffect, useRef } from 'react';
import { supabase, Profile, School, DailyLesson, GradeLevel } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import { getNavForRole, getDefaultTab } from '../../lib/nav';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import AiChatWidget from '../../components/AiChatWidget';
import HelpTicketModal from '../../components/HelpTicketModal';
import {
  Users, BookOpen, Upload, BarChart3, Settings, Plus, Check, X, Eye, Trash2,
  RefreshCw, Mic, MicOff, Image, Play, Square, AlertCircle, School as SchoolIcon,
  TrendingUp, UserPlus, FileText, Calendar, Volume2
} from 'lucide-react';

const GRADE_LEVELS: { value: GradeLevel; ar: string; en: string }[] = [
  { value: 'primary', ar: 'الابتدائية', en: 'Primary' },
  { value: 'preparatory', ar: 'الإعدادية', en: 'Preparatory' },
  { value: 'intermediate', ar: 'المتوسطة', en: 'Intermediate' },
  { value: 'secondary', ar: 'الثانوية', en: 'Secondary' },
];

const SUBJECTS_SYRIA = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الإنجليزية', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا'];
const SUBJECTS_LEBANON = ['الرياضيات', 'العلوم', 'اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'الفيزياء', 'الكيمياء', 'الأحياء', 'التاريخ', 'الجغرافيا'];

export default function SchoolDashboard() {
  const { profile } = useAuth();
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState(getDefaultTab('school'));
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSchool() {
      if (!profile?.school_id) return;
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();
      setSchool(data);
      setLoading(false);
    }
    loadSchool();
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  const navItems = getNavForRole('school');

  const renderTab = () => {
    switch (activeTab) {
      case 'school_dashboard':
        return <SchoolOverview school={school} />;
      case 'school_students':
        return <SchoolStudents school={school} />;
      case 'school_lessons':
        return <SchoolLessons school={school} />;
      case 'school_uploads':
        return <LessonUpload school={school} />;
      case 'school_reports':
        return <SchoolReports school={school} />;
      case 'school_settings':
        return <SchoolSettings school={school} setSchool={setSchool} />;
      default:
        return <SchoolOverview school={school} />;
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 bg-mesh">
      <Sidebar
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
      />
      <main className="lg:ps-64 min-h-screen">
        <MobileNav navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
        <div className="p-4 lg:p-8 pb-24">
          <div className="animate-fade-in max-w-7xl mx-auto">
            {renderTab()}
          </div>
        </div>
      </main>
      <HelpTicketModal />
    </div>
  );
}

// ─── School Overview ─────────────────────────────────────────────────────────────
function SchoolOverview({ school }: { school: School | null }) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    quotaUsed: 0,
    todayLessons: 0,
    activeTeachers: 0,
  });

  useEffect(() => {
    async function loadStats() {
      if (!school) return;
      const [studentsRes, lessonsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .eq('school_id', school.id).eq('role', 'student').eq('status', 'active'),
        supabase.from('daily_lessons').select('id', { count: 'exact', head: true })
          .eq('school_id', school.id).eq('scheduled_date', new Date().toISOString().split('T')[0]),
      ]);
      setStats({
        totalStudents: studentsRes.count || 0,
        quotaUsed: Math.round(((studentsRes.count || 0) / school.max_students_allowed) * 100),
        todayLessons: lessonsRes.count || 0,
        activeTeachers: 0,
      });
    }
    loadStats();
  }, [school]);

  const quotaColor = stats.quotaUsed >= 90 ? 'from-red-600 to-red-800' :
                     stats.quotaUsed >= 70 ? 'from-amber-600 to-amber-800' :
                     'from-emerald-600 to-emerald-800';

  const cards = [
    { label: lang === 'ar' ? 'الطلاب المسجلين' : 'Registered Students', value: stats.totalStudents, icon: Users, color: 'from-primary-600 to-primary-800', glow: 'rgba(37,99,235,0.4)' },
    { label: lang === 'ar' ? 'استخدام الحصة' : 'Quota Used', value: `${stats.quotaUsed}%`, icon: TrendingUp, color: quotaColor, glow: stats.quotaUsed >= 90 ? 'rgba(220,38,38,0.4)' : 'rgba(5,150,105,0.4)' },
    { label: lang === 'ar' ? 'دروس اليوم' : 'Today\'s Lessons', value: stats.todayLessons, icon: BookOpen, color: 'from-gold-600 to-gold-800', glow: 'rgba(212,175,55,0.4)' },
    { label: lang === 'ar' ? 'المعلمين النشطاء' : 'Active Teachers', value: stats.activeTeachers, icon: SchoolIcon, color: 'from-teal-600 to-teal-800', glow: 'rgba(13,148,136,0.4)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with school info */}
      <div className="glass-card-3d p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-400">{school?.name || t('dashboard')}</h1>
          <p className="text-white/50 text-sm mt-1">
            {school?.city}, {school?.country === 'syria' ? (lang === 'ar' ? 'سوريا' : 'Syria') : (lang === 'ar' ? 'لبنان' : 'Lebanon')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl ${school?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'} text-sm font-medium`}>
            {school?.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معلق' : 'Suspended')}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card-3d p-5 hover:scale-105 transition-all duration-300" style={{ boxShadow: `0 4px 30px ${c.glow}` }}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-white">{c.value}</div>
              <div className="text-white/50 text-xs mt-1">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* Quota progress bar */}
      <div className="glass-card-3d p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gold-400">{lang === 'ar' ? 'حصة المقاعد' : 'Seat Quota'}</h3>
          <span className="text-white/70 text-sm">
            {stats.totalStudents} / {school?.max_students_allowed || 0}
          </span>
        </div>
        <div className="h-4 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${quotaColor} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(stats.quotaUsed, 100)}%` }}
          />
        </div>
        {stats.quotaUsed >= 90 && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">{lang === 'ar' ? 'تحذير: الحصة على وشك النفاد!' : 'Warning: Quota almost full!'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── School Students Management ─────────────────────────────────────────────────
function SchoolStudents({ school }: { school: School | null }) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  async function loadStudents() {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('school_id', school.id)
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    setStudents(data || []);
    const currentCount = (data || []).length;
    setQuotaExceeded(currentCount >= school.max_students_allowed);
    setLoading(false);
  }

  useEffect(() => { loadStudents(); }, [school]);

  const gradeLabels: Record<string, string> = {
    primary: lang === 'ar' ? 'ابتدائي' : 'Primary',
    preparatory: lang === 'ar' ? 'إعدادي' : 'Preparatory',
    intermediate: lang === 'ar' ? 'متوسط' : 'Intermediate',
    secondary: lang === 'ar' ? 'ثانوي' : 'Secondary',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'إدارة الطلاب' : 'Student Management'}</h1>
        <div className="flex gap-2">
          <button onClick={loadStudents} className="p-2 glass rounded-xl text-white/60 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={quotaExceeded}
            className={`premium-btn flex items-center gap-2 ${quotaExceeded ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <UserPlus className="w-5 h-5" />
            {lang === 'ar' ? 'إضافة طالب' : 'Add Student'}
          </button>
        </div>
      </div>

      {quotaExceeded && (
        <div className="glass-card p-4 bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{lang === 'ar' ? 'تم الوصول للحد الأقصى من الطلاب!' : 'Maximum student quota reached!'}</span>
        </div>
      )}

      <div className="glass-card-3d overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/20">
                {[
                  lang === 'ar' ? 'الاسم' : 'Name',
                  lang === 'ar' ? 'البريد' : 'Email',
                  lang === 'ar' ? 'المستوى' : 'Grade',
                  lang === 'ar' ? 'الحالة' : 'Status',
                  lang === 'ar' ? 'الإجراءات' : 'Actions',
                ].map(h => (
                  <th key={h} className="py-4 px-4 text-start text-gold-400 text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      {[...Array(5)].map((_, j) => (
                        <td key={j} className="py-4 px-4"><div className="h-5 shimmer-bg rounded" /></td>
                      ))}
                    </tr>
                  ))
                : students.length === 0
                  ? <tr><td colSpan={5} className="text-center py-10 text-white/30">{lang === 'ar' ? 'لا يوجد طلاب بعد' : 'No students yet'}</td></tr>
                  : students.map(s => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gold-500 to-gold-700 rounded-xl flex items-center justify-center text-navy-950 font-bold">
                              {s.full_name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <span className="font-medium text-white">{s.full_name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/60">{s.email}</td>
                        <td className="py-4 px-4">
                          <span className="badge badge-info">{s.grade_level ? gradeLabels[s.grade_level] : '-'}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={s.status === 'active' ? 'badge-success' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}>
                            {s.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') : s.status === 'pending' ? (lang === 'ar' ? 'معلق' : 'Pending') : (lang === 'ar' ? 'مرفوض' : 'Rejected')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                await supabase.from('profiles').update({ status: 'active' }).eq('id', s.id);
                                loadStudents();
                              }}
                              className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا الطالب؟' : 'Are you sure you want to delete this student?')) {
                                  await supabase.from('profiles').delete().eq('id', s.id);
                                  loadStudents();
                                }
                              }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddStudentModal school={school} onClose={() => setShowAddModal(false)} onAdded={loadStudents} />
      )}
    </div>
  );
}

function AddStudentModal({ school, onClose, onAdded }: { school: School | null; onClose: () => void; onAdded: () => void }) {
  const { lang } = useLang();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', grade_level: 'secondary' as GradeLevel,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!school) return;

    // Check quota before adding
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', school.id)
      .eq('role', 'student');

    if ((count || 0) >= school.max_students_allowed) {
      setError(lang === 'ar' ? 'تم الوصول للحد الأقصى من الطلاب!' : 'Maximum quota reached!');
      return;
    }

    setSaving(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: 'student',
          school_id: school.id,
          grade_level: form.grade_level,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      onAdded();
      onClose();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-3d p-6 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gold-400">{lang === 'ar' ? 'إضافة طالب جديد' : 'Add New Student'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الاسم الكامل' : 'Full Name'} *</label>
            <input
              value={form.fullName}
              onChange={e => setForm({ ...form, fullName: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} *</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'كلمة المرور' : 'Password'} *</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="input-field"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'المستوى الدراسي' : 'Grade Level'} *</label>
            <select
              value={form.grade_level}
              onChange={e => setForm({ ...form, grade_level: e.target.value as GradeLevel })}
              className="input-field"
            >
              {GRADE_LEVELS.map(g => (
                <option key={g.value} value={g.value}>{lang === 'ar' ? g.ar : g.en}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="premium-btn flex-1 flex items-center justify-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
              {lang === 'ar' ? 'إضافة' : 'Add'}
            </button>
            <button type="button" onClick={onClose} className="premium-btn-outline">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── School Lessons Management ─────────────────────────────────────────────────
function SchoolLessons({ school }: { school: School | null }) {
  const { t, lang } = useLang();
  const [lessons, setLessons] = useState<DailyLesson[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadLessons() {
    if (!school) return;
    setLoading(true);
    const { data } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('school_id', school.id)
      .order('scheduled_date', { ascending: false });
    setLessons(data || []);
    setLoading(false);
  }

  useEffect(() => { loadLessons(); }, [school]);

  const gradeLabels: Record<string, string> = {
    primary: lang === 'ar' ? 'ابتدائي' : 'Primary',
    preparatory: lang === 'ar' ? 'إعدادي' : 'Preparatory',
    intermediate: lang === 'ar' ? 'متوسط' : 'Intermediate',
    secondary: lang === 'ar' ? 'ثانوي' : 'Secondary',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'الدروس اليومية' : 'Daily Lessons'}</h1>
        <button onClick={loadLessons} className="p-2 glass rounded-xl text-white/60 hover:text-white">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid gap-4">
        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="glass-card-3d p-5 shimmer-bg h-32" />)
          : lessons.length === 0
            ? <div className="glass-card-3d p-10 text-center text-white/30">{lang === 'ar' ? 'لا توجد دروس بعد' : 'No lessons yet'}</div>
            : lessons.map(lesson => (
                <div key={lesson.id} className="glass-card-3d p-5 hover:border-gold-500/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="badge badge-info">{lesson.subject}</span>
                        <span className="badge" style={{ background: 'rgba(212,175,55,0.2)', border: '1px solid rgba(212,175,55,0.3)', color: '#d4af37' }}>
                          {gradeLabels[lesson.target_grade] || lesson.target_grade}
                        </span>
                        <span className="text-white/40 text-sm">
                          {new Date(lesson.scheduled_date).toLocaleDateString(lang === 'ar' ? 'ar-SY' : 'en-US')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{lesson.title}</h3>
                      <p className="text-white/60 text-sm line-clamp-2">{lesson.content}</p>
                      {lesson.attached_media && lesson.attached_media.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {lesson.attached_media.map((m, i) => (
                            <div key={i} className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-white/60">
                              {m.type === 'image' ? <Image className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                              {m.type === 'image' ? (lang === 'ar' ? 'صورة' : 'Image') : (lang === 'ar' ? 'صوت' : 'Audio')}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          await supabase.from('daily_lessons').delete().eq('id', lesson.id);
                          loadLessons();
                        }}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
        }
      </div>
    </div>
  );
}

// ─── Lesson Upload with Media ──────────────────────────────────────────────────
function LessonUpload({ school }: { school: School | null }) {
  const { t, lang } = useLang();
  const { profile } = useAuth();
  const [form, setForm] = useState({
    title: '',
    content: '',
    subject: '',
    target_grade: 'secondary' as GradeLevel,
    scheduled_date: new Date().toISOString().split('T')[0],
  });
  const [mediaFiles, setMediaFiles] = useState<Array<{ type: 'image' | 'audio'; data: string; caption?: string }>>([]);
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const subjects = school?.country === 'lebanon' ? SUBJECTS_LEBANON : SUBJECTS_SYRIA;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaFiles(prev => [...prev, { type: 'image', data: reader.result as string, caption: file.name }]);
      };
      reader.readAsDataURL(file);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = e => audioChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaFiles(prev => [...prev, { type: 'audio', data: reader.result as string }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      alert(lang === 'ar' ? 'تعذر الوصول إلى الميكروفون' : 'Could not access microphone');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function removeMedia(index: number) {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!school || !form.title || !form.content || !form.subject) return;
    setSaving(true);

    await supabase.from('daily_lessons').insert({
      school_id: school.id,
      teacher_id: profile?.id,
      title: form.title,
      content: form.content,
      subject: form.subject,
      target_grade: form.target_grade,
      country: school.country,
      scheduled_date: form.scheduled_date,
      attached_media: mediaFiles,
    });

    setForm({ title: '', content: '', subject: '', target_grade: 'secondary', scheduled_date: new Date().toISOString().split('T')[0] });
    setMediaFiles([]);
    setSaving(false);
    alert(lang === 'ar' ? 'تم حفظ الدرس بنجاح!' : 'Lesson saved successfully!');
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'إضافة درس جديد' : 'Upload New Lesson'}</h1>

      <div className="glass-card-3d p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'عنوان الدرس' : 'Lesson Title'} *</label>
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'المادة' : 'Subject'} *</label>
              <select
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className="input-field"
                required
              >
                <option value="">{lang === 'ar' ? '-- اختر المادة --' : '-- Select --'}</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'المستوى الدراسي' : 'Target Grade'} *</label>
              <select
                value={form.target_grade}
                onChange={e => setForm({ ...form, target_grade: e.target.value as GradeLevel })}
                className="input-field"
              >
                {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{lang === 'ar' ? g.ar : g.en}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'تاريخ الدرس' : 'Scheduled Date'} *</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'محتوى الدرس' : 'Lesson Content'} *</label>
            <textarea
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="input-field min-h-[150px]"
              required
            />
          </div>

          {/* Media Upload Section */}
          <div className="glass-card p-4 space-y-4">
            <h4 className="text-gold-400 font-bold">{lang === 'ar' ? 'الوسائط المرفقة' : 'Attached Media'}</h4>

            {/* Image Upload */}
            <div className="flex items-center gap-4">
              <label className="flex-1 flex items-center gap-3 glass-card p-4 cursor-pointer hover:border-gold-500/30 transition-colors">
                <Image className="w-6 h-6 text-gold-400" />
                <span className="text-white/60">{lang === 'ar' ? 'رفع صور (لوح السبورات، الدفاتر)' : 'Upload images (whiteboards, notebooks)'}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Voice Recording */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-full flex items-center justify-center gap-3 glass-card p-4 transition-all ${
                  recording ? 'bg-red-500/20 border-red-500/30' : 'hover:border-gold-500/30'
                }`}
              >
                {recording ? <MicOff className="w-6 h-6 text-red-400 animate-pulse" /> : <Mic className="w-6 h-6 text-gold-400" />}
                <span className="text-white/60">
                  {recording
                    ? (lang === 'ar' ? 'جاري التسجيل... اترك للإيقاف' : 'Recording... Release to stop')
                    : (lang === 'ar' ? 'اضغط للتسجيل الصوتي' : 'Press to record voice')}
                </span>
              </button>
            </div>

            {/* Media Preview */}
            {mediaFiles.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h5 className="text-white/70 text-sm">{lang === 'ar' ? 'الملفات المرفقة:' : 'Attached files:'}</h5>
                <div className="grid sm:grid-cols-2 gap-3">
                  {mediaFiles.map((m, i) => (
                    <div key={i} className="glass-card p-3 flex items-center gap-3">
                      {m.type === 'image' ? (
                        <img src={m.data} alt="" className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <audio controls src={m.data} className="flex-1 h-10" />
                      )}
                      <div className="flex-1 text-xs text-white/50">
                        {m.type === 'image' ? m.caption : (lang === 'ar' ? 'تسجيل صوتي' : 'Audio recording')}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedia(i)}
                        className="p-1 rounded bg-red-500/20 text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving} className="premium-btn w-full flex items-center justify-center gap-2">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-5 h-5" />}
            {lang === 'ar' ? 'حفظ الدرس' : 'Save Lesson'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── School Reports ────────────────────────────────────────────────────────────
function SchoolReports({ school }: { school: School | null }) {
  const { lang } = useLang();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (!school) return;
    supabase
      .from('chat_messages')
      .select('*, profiles!chat_messages_student_id_fkey(full_name)')
      .eq('school_id', school.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setLogs(data || []));
  }, [school]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'التقارير والتحليلات' : 'Reports & Analytics'}</h1>
      <div className="glass-card-3d p-5">
        <h3 className="text-lg font-bold text-white mb-4">{lang === 'ar' ? 'سجلات تفاعل الذكاء الاصطناعي' : 'AI Interaction Logs'}</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0
            ? <p className="text-center text-white/30 py-8">{lang === 'ar' ? 'لا توجد سجلات بعد' : 'No logs yet'}</p>
            : logs.map(log => (
                <div key={log.id} className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gold-400">{log.profiles?.full_name}</span>
                    <span className="text-white/30 text-xs">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-white/70 text-sm"><span className="text-white/40">Q:</span> {log.user_message}</div>
                  <div className="text-white/50 text-xs mt-1 line-clamp-2"><span className="text-white/40">A:</span> {log.ai_response}</div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── School Settings ───────────────────────────────────────────────────────────
function SchoolSettings({ school, setSchool }: { school: School | null; setSchool: (s: School) => void }) {
  const { lang } = useLang();
  const [saving, setSaving] = useState(false);

  if (!school) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'إعدادات المدرسة' : 'School Settings'}</h1>
      <div className="glass-card-3d p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'اسم المدرسة' : 'School Name'}</label>
            <input value={school.name} className="input-field" readOnly />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الدولة' : 'Country'}</label>
            <input value={school.country === 'syria' ? (lang === 'ar' ? 'سوريا' : 'Syria') : (lang === 'ar' ? 'لبنان' : 'Lebanon')} className="input-field" readOnly />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'المدينة' : 'City'}</label>
            <input value={school.city || ''} className="input-field" readOnly />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
            <input value={school.email} className="input-field" readOnly />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الحد الأقصى للطلاب' : 'Maximum Students'}</label>
            <input value={school.max_students_allowed} className="input-field" readOnly />
            <p className="text-amber-400/60 text-xs mt-1">{lang === 'ar' ? '(يتحكم به المدير الأعلى فقط)' : '(Controlled by Admin only)'}</p>
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الطلاب الحاليين' : 'Current Students'}</label>
            <input value={school.current_students_count} className="input-field" readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
