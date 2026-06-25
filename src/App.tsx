import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { LangProvider } from './lib/lang';
import { getDefaultTab } from './lib/nav';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import type { UserRole } from './lib/supabase';

function RoleSwitcher() {
  const { role, setRole } = useAuth();

  const roles: { value: UserRole; label: string; color: string }[] = [
    { value: 'super_admin', label: 'Admin',   color: 'bg-red-500/20 border-red-500/40 text-red-300'     },
    { value: 'teacher',     label: 'Teacher', color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
    { value: 'student',     label: 'Student', color: 'bg-primary-500/20 border-primary-500/40 text-primary-300' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 bg-navy-900/90 backdrop-blur border border-white/15 rounded-2xl p-1.5 shadow-2xl">
      {roles.map(r => (
        <button
          key={r.value}
          onClick={() => setRole(r.value)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
            role === r.value
              ? r.color + ' scale-105 shadow-glow'
              : 'bg-transparent border-transparent text-white/30 hover:text-white/60'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function AppContent() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    if (profile?.role) {
      setActiveTab(getDefaultTab(profile.role));
    }
  }, [profile?.role]);

  if (!user || !profile || !activeTab) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary-700 border-t-primary-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 bg-mesh">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="lg:ps-64 pt-14 lg:pt-0 pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 lg:p-6">
          {profile.role === 'super_admin' && <AdminDashboard activeTab={activeTab} />}
          {profile.role === 'teacher'     && <TeacherDashboard activeTab={activeTab} />}
          {profile.role === 'student'     && <StudentDashboard activeTab={activeTab} />}
        </div>
      </main>

      {profile.role !== 'student' && <RoleSwitcher />}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LangProvider>
  );
}
