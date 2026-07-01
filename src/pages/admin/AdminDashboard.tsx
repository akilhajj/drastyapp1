import React, { useEffect, useState } from 'react';
import { supabase, Profile, Banner, CurriculumPdf, Subject, School } from '../../lib/supabase';
import { useLang } from '../../lib/lang';
import { useAuth } from '../../lib/auth';
import SchedulesModule from '../shared/SchedulesModule';
import QuizBuilder from '../shared/QuizBuilder';
import QuestionBank from '../shared/QuestionBank';
import LessonPlannerModule from '../shared/LessonPlannerModule';
import PreferencesPanel from './PreferencesPanel';
import Sidebar from '../../components/Sidebar';
import MobileNav from '../../components/MobileNav';
import { getNavForRole, getDefaultTab } from '../../lib/nav';
import {
  Users, GraduationCap, Ticket, Check, X, Plus,
  BarChart3, AlertCircle, Send, Eye, Trash2, RefreshCw,
  Building, TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState(getDefaultTab('super_admin'));

  if (!profile) return null;

  const navItems = getNavForRole('super_admin');

  return (
    <div className="min-h-screen bg-navy-950 bg-mesh">
      <Sidebar navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
      <main className="lg:ps-64 min-h-screen">
        <MobileNav navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} profile={profile} />
        <div className="p-4 lg:p-8 pb-24">
          <div className="animate-fade-in max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <AdminOverview />}
            {activeTab === 'schools' && <AdminSchools />}
            {activeTab === 'students' && <AdminStudents />}
            {activeTab === 'teachers' && <AdminTeachers />}
            {activeTab === 'curriculum' && <AdminCurriculum />}
            {activeTab === 'subjects' && <AdminSubjects />}
            {activeTab === 'banners' && <AdminBanners />}
            {activeTab === 'notifications' && <AdminNotifications />}
            {activeTab === 'reports' && <AdminReports />}
            {activeTab === 'schedules' && <SchedulesModule />}
            {activeTab === 'quizBuilder' && <QuizBuilder />}
            {activeTab === 'questionBank' && <QuestionBank />}
            {activeTab === 'lessonPlanner' && <LessonPlannerModule />}
            {activeTab === 'preferences' && <PreferencesPanel />}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function AdminOverview() {
  const { t, lang } = useLang();
  const [stats, setStats] = useState({ schools: 0, students: 0, teachers: 0, pending: 0, openTickets: 0, closedTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [a, b, c, d, e, f] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('status', 'active'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('help_tickets').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
        supabase.from('schools').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);
      setStats({
        schools: f.count || 0,
        students: a.count || 0,
        teachers: b.count || 0,
        pending: c.count || 0,
        openTickets: d.count || 0,
        closedTickets: e.count || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label: lang === 'ar' ? 'المدارس النشطة' : 'Active Schools', value: stats.schools, icon: Building, color: 'from-gold-600 to-gold-800', glow: 'rgba(212,175,55,0.4)' },
    { label: t('activeStudents'), value: stats.students, icon: Users, color: 'from-primary-600 to-primary-800', glow: 'rgba(37,99,235,0.4)' },
    { label: t('totalTeachers'), value: stats.teachers, icon: GraduationCap, color: 'from-emerald-600 to-emerald-800', glow: 'rgba(5,150,105,0.4)' },
    { label: t('pendingStudents'), value: stats.pending, icon: AlertCircle, color: 'from-amber-600 to-amber-800', glow: 'rgba(217,119,6,0.4)' },
    { label: t('openTickets'), value: stats.openTickets, icon: Ticket, color: 'from-red-600 to-red-800', glow: 'rgba(220,38,38,0.4)' },
    { label: t('closedTickets'), value: stats.closedTickets, icon: Check, color: 'from-teal-600 to-teal-800', glow: 'rgba(13,148,136,0.4)' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gold-400">{t('dashboard')}</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-card-3d p-5 hover:scale-105 transition-all duration-300" style={{ boxShadow: `0 4px 30px ${c.glow}` }}>
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
    </div>
  );
}

// ─── Schools Management ────────────────────────────────────────────────────────
function AdminSchools() {
  const { t, lang } = useLang();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  async function loadSchools() {
    setLoading(true);
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    setSchools(data || []);
    setLoading(false);
  }

  useEffect(() => { loadSchools(); }, []);

  const COUNTRY_LABEL: Record<string, { ar: string; en: string }> = {
    syria: { ar: 'سوريا', en: 'Syria' },
    lebanon: { ar: 'لبنان', en: 'Lebanon' },
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-400">{lang === 'ar' ? 'إدارة المدارس' : 'School Management'}</h1>
        <div className="flex gap-2">
          <button onClick={loadSchools} className="p-2 glass rounded-xl text-white/60 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowAddModal(true)} className="premium-btn flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {lang === 'ar' ? 'إضافة مدرسة' : 'Add School'}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="glass-card-3d p-5 shimmer-bg h-32" />)
          : schools.length === 0
            ? <div className="glass-card-3d p-10 text-center text-white/30">{lang === 'ar' ? 'لا توجد مدارس بعد' : 'No schools yet'}</div>
            : schools.map(school => (
                <div key={school.id} className="glass-card-3d p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-700 rounded-xl flex items-center justify-center">
                          <Building className="w-6 h-6 text-navy-950" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{school.name}</h3>
                          <p className="text-white/50 text-sm">{school.city}, {lang === 'ar' ? COUNTRY_LABEL[school.country]?.ar : COUNTRY_LABEL[school.country]?.en}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          school.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          school.status === 'suspended' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {school.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') :
                           school.status === 'suspended' ? (lang === 'ar' ? 'معلق' : 'Suspended') :
                           (lang === 'ar' ? 'مغلق' : 'Closed')}
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-3 bg-white/5 rounded-xl">
                          <div className="text-white/50 text-xs">{lang === 'ar' ? 'الطلاب الحاليين' : 'Current Students'}</div>
                          <div className="text-xl font-bold text-white">{school.current_students_count}</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <div className="text-white/50 text-xs">{lang === 'ar' ? 'الحد الأقصى' : 'Max Allowed'}</div>
                          <div className="text-xl font-bold text-gold-400">{school.max_students_allowed}</div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <div className="text-white/50 text-xs">{lang === 'ar' ? 'استخدام الحصة' : 'Quota Usage'}</div>
                          <div className="text-xl font-bold text-white">
                            {Math.round((school.current_students_count / school.max_students_allowed) * 100)}%
                          </div>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                          <div className="text-white/50 text-xs">{lang === 'ar' ? 'البريد' : 'Email'}</div>
                          <div className="text-sm font-medium text-white truncate">{school.email}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ms-4">
                      <button onClick={() => setEditingSchool(school)} className="p-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          const newStatus = school.status === 'active' ? 'suspended' : 'active';
                          await supabase.from('schools').update({ status: newStatus }).eq('id', school.id);
                          loadSchools();
                        }}
                        className={`p-2 rounded-lg ${school.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} hover:opacity-80`}
                      >
                        {school.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))
        }
      </div>

      {showAddModal && <AddSchoolModal onClose={() => setShowAddModal(false)} onAdded={loadSchools} />}
      {editingSchool && <EditSchoolModal school={editingSchool} onClose={() => setEditingSchool(null)} onSaved={loadSchools} />}
    </div>
  );
}

function AddSchoolModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', city: '', country: 'syria' as 'syria' | 'lebanon', max_students_allowed: 100 });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('schools').insert({ ...form, status: 'active' });
    onAdded();
    onClose();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-3d p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gold-400">{lang === 'ar' ? 'إضافة مدرسة جديدة' : 'Add New School'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'اسم المدرسة' : 'School Name'} *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الهاتف' : 'Phone'}</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الدولة' : 'Country'} *</label>
              <select value={form.country} onChange={e => setForm({ ...form, country: e.target.value as 'syria' | 'lebanon' })} className="input-field">
                <option value="syria">{lang === 'ar' ? 'سوريا' : 'Syria'}</option>
                <option value="lebanon">{lang === 'ar' ? 'لبنان' : 'Lebanon'}</option>
              </select>
            </div>
            <div>
              <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'المدينة' : 'City'}</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input-field" />
            </div>
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الحد الأقصى للطلاب' : 'Max Students Allowed'}</label>
            <input type="number" value={form.max_students_allowed} onChange={e => setForm({ ...form, max_students_allowed: parseInt(e.target.value) || 100 })} className="input-field" min="1" />
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

function EditSchoolModal({ school, onClose, onSaved }: { school: School; onClose: () => void; onSaved: () => void }) {
  const { lang } = useLang();
  const [form, setForm] = useState({ name: school.name, email: school.email, max_students_allowed: school.max_students_allowed, status: school.status });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from('schools').update(form).eq('id', school.id);
    onSaved();
    onClose();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-3d p-6 w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gold-400">{lang === 'ar' ? 'تعديل المدرسة' : 'Edit School'}</h3>
          <button onClick={onClose} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'اسم المدرسة' : 'School Name'}</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الحد الأقصى للطلاب' : 'Max Students Allowed'}</label>
            <input type="number" value={form.max_students_allowed} onChange={e => setForm({ ...form, max_students_allowed: parseInt(e.target.value) || 100 })} className="input-field" min="1" />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1 block">{lang === 'ar' ? 'الحالة' : 'Status'}</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field">
              <option value="active">{lang === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="suspended">{lang === 'ar' ? 'معلق' : 'Suspended'}</option>
              <option value="closed">{lang === 'ar' ? 'مغلق' : 'Closed'}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving} className="premium-btn flex-1 flex items-center justify-center gap-2">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
              {lang === 'ar' ? 'حفظ' : 'Save'}
            </button>
            <button type="button" onClick={onClose} className="premium-btn-outline">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Students ────────────────────────────────────────────────────────────────
function AdminStudents() {
  const { t, lang } = useLang();
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false });
    setStudents(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-400">{t('students')}</h1>
        <button onClick={load} className="p-2 glass rounded-xl text-white/60 hover:text-white"><RefreshCw className="w-5 h-5" /></button>
      </div>
      <div className="glass-card-3d overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/20">
                {[t('fullName'), t('email'), t('status'), t('actions')].map(h => (
                  <th key={h} className="py-3 px-4 text-start text-gold-400 text-xs font-bold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => <tr key={i} className="border-b border-white/5">{[...Array(4)].map((_, j) => <td key={j} className="py-3 px-4"><div className="h-5 shimmer-bg rounded" /></td>)}</tr>)
                : students.length === 0
                  ? <tr><td colSpan={4} className="text-center py-10 text-white/30">{t('noData')}</td></tr>
                  : students.map(s => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-gold-500 to-gold-700 rounded-lg flex items-center justify-center text-navy-950 text-xs font-bold">{s.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <span className="text-sm text-white font-medium">{s.full_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-white/60 text-sm">{s.email}</td>
                        <td className="py-3 px-4">
                          <span className={s.status === 'active' ? 'badge-success' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}>
                            {s.status === 'active' ? t('active') : s.status === 'pending' ? t('pendingApproval') : (lang === 'ar' ? 'مرفوض' : 'Rejected')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <button onClick={async () => { await supabase.from('profiles').update({ status: 'active' }).eq('id', s.id); load(); }} className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={async () => { if (confirm(lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) { await supabase.from('profiles').delete().eq('id', s.id); load(); } }} className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><Trash2 className="w-3.5 h-3.5" /></button>
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

function AdminTeachers() {
  const { t, lang } = useLang();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('role', 'teacher');
      setTeachers(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{t('teachers')}</h1>
      <div className="glass-card-3d overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gold-500/20">{[t('fullName'), t('email')].map(h => <th key={h} className="py-3 px-4 text-start text-gold-400 text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {loading ? [...Array(3)].map((_, i) => <tr key={i}><td colSpan={2} className="py-3 px-4"><div className="h-5 shimmer-bg rounded" /></td></tr>) :
             teachers.length === 0 ? <tr><td colSpan={2} className="text-center py-10 text-white/30">{t('noData')}</td></tr> :
             teachers.map(t => (
               <tr key={t.id} className="border-b border-white/5">
                 <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center text-white text-xs font-bold">{t.full_name?.charAt(0)?.toUpperCase() || 'T'}</div><span className="text-white">{t.full_name}</span></div></td>
                 <td className="py-3 px-4 text-white/60">{t.email}</td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCurriculum() {
  const { t, lang } = useLang();
  return <div className="glass-card-3d p-6"><h2 className="text-xl font-bold text-gold-400">{t('curriculum')}</h2><p className="text-white/50 mt-4">{t('noData')}</p></div>;
}

function AdminSubjects() {
  const { t, lang } = useLang();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  useEffect(() => {
    supabase.from('subjects').select('*').order('order_index').then(({ data }) => setSubjects(data || []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{t('subjects')}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map(s => (
          <div key={s.id} className="glass-card-3d p-5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-bold text-white">{lang === 'ar' ? s.name_ar : s.name_en}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminBanners() {
  const { t, lang } = useLang();
  const [banners, setBanners] = useState<Banner[]>([]);
  useEffect(() => {
    supabase.from('banners').select('*').order('order_index').then(({ data }) => setBanners(data || []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{t('banners')}</h1>
      {banners.map(b => (
        <div key={b.id} className="glass-card-3d p-4 flex items-center gap-4">
          {b.image_url && <img src={b.image_url} className="w-16 h-12 object-cover rounded-lg" alt="" />}
          <div className="flex-1"><div className="font-medium text-white">{lang === 'ar' ? b.title_ar : b.title_en}</div></div>
        </div>
      ))}
    </div>
  );
}

function AdminNotifications() {
  const { t, lang } = useLang();
  const [form, setForm] = useState({ title_ar: '', title_en: '', body_ar: '', body_en: '', type: 'info' as const });
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  async function send() {
    if (!form.title_ar || !form.body_ar) return;
    setSending(true);
    await supabase.from('notifications').insert({ ...form, is_global: true, sender_id: user?.id });
    setForm({ title_ar: '', title_en: '', body_ar: '', body_en: '', type: 'info' });
    setSending(false);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{t('notifications')}</h1>
      <div className="glass-card-3d p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <input value={form.title_ar} onChange={e => setForm({ ...form, title_ar: e.target.value })} className="input-field" placeholder={lang === 'ar' ? 'العنوان (عربي)' : 'Title (AR)'} />
          <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input-field" placeholder={lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (EN)'} />
          <textarea value={form.body_ar} onChange={e => setForm({ ...form, body_ar: e.target.value })} className="input-field" rows={2} placeholder={lang === 'ar' ? 'الرسالة (عربي)' : 'Message (AR)'} />
          <textarea value={form.body_en} onChange={e => setForm({ ...form, body_en: e.target.value })} className="input-field" rows={2} placeholder={lang === 'ar' ? 'الرسالة (إنجليزي)' : 'Message (EN)'} />
        </div>
        <button onClick={send} disabled={sending} className="premium-btn flex items-center gap-2"><Send className="w-4 h-4" />{t('sendNotification')}</button>
      </div>
    </div>
  );
}

function AdminReports() {
  const { t, lang } = useLang();
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('ai_chat_logs').select('*, profiles!ai_chat_logs_student_id_fkey(full_name)').order('created_at', { ascending: false }).limit(30).then(({ data }) => setLogs(data || []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gold-400">{t('reports')}</h1>
      <div className="glass-card-3d p-5">
        <h3 className="font-bold text-white mb-4">{lang === 'ar' ? 'سجلات تفاعل الذكاء الاصطناعي' : 'AI Interaction Logs'}</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? <p className="text-center text-white/30 py-8">{t('noData')}</p> : logs.map(log => (
            <div key={log.id} className="p-3 rounded-xl bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gold-400">{log.profiles?.full_name}</span>
                <span className="text-white/30 text-xs">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <div className="text-white/70 text-xs"><span className="text-white/40">Q:</span> {log.user_message}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
