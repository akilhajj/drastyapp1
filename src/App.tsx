import React from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { LangProvider } from './lib/lang';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import TeacherDashboard from './components/teacher/TeacherDashboard';


function AppContent() {
  const { profile, loading } = useAuth();

  // 1. شاشة تحميل لمنع الانهيار
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 2. إذا لم يسجل دخول، افتحه على صفحة الدخول الدولية فوراً
  if (!profile) {
    return <AuthPage />;
  }

  // 3. توجيه المستخدم حسب رتبته في قاعدة البيانات
  switch (profile.role) {
    case 'super_admin':
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
    default:
      return <StudentDashboard />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <AppContent />
      </LangProvider>
    </AuthProvider>
  );
}
