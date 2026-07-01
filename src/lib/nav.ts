import {
  LayoutDashboard, Users, BookOpen, FileText, Bell, Ticket,
  GraduationCap, BarChart3, Image,
  CalendarDays, ClipboardList, Database, BookMarked, Settings,
  School, MessageSquare, Mic, Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from './supabase';

export interface NavItem {
  key: string;
  icon: LucideIcon;
  labelKey: string;
  roles: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  // ── Supreme Admin (Platform Owner) ────────────────────────────────
  { key: 'dashboard',     icon: LayoutDashboard, labelKey: 'dashboard',      roles: ['super_admin'] },
  { key: 'schools',       icon: School,          labelKey: 'schools',        roles: ['super_admin'] },
  { key: 'students',      icon: Users,           labelKey: 'students',       roles: ['super_admin'] },
  { key: 'teachers',      icon: GraduationCap,   labelKey: 'teachers',       roles: ['super_admin'] },
  { key: 'curriculum',    icon: FileText,        labelKey: 'curriculum',     roles: ['super_admin'] },
  { key: 'subjects',      icon: BookOpen,        labelKey: 'subjects',       roles: ['super_admin'] },
  { key: 'banners',       icon: Image,           labelKey: 'banners',        roles: ['super_admin'] },
  { key: 'notifications', icon: Bell,            labelKey: 'notifications',  roles: ['super_admin'] },
  { key: 'reports',       icon: BarChart3,       labelKey: 'reports',        roles: ['super_admin'] },
  { key: 'preferences',   icon: Settings,        labelKey: 'preferences',    roles: ['super_admin'] },

  // ── School Administrator ─────────────────────────────────────────
  { key: 'school_dashboard',    icon: LayoutDashboard, labelKey: 'dashboard',         roles: ['school'] },
  { key: 'school_students',     icon: Users,           labelKey: 'students',          roles: ['school'] },
  { key: 'school_lessons',      icon: BookOpen,        labelKey: 'dailyLessons',      roles: ['school'] },
  { key: 'school_uploads',      icon: Upload,          labelKey: 'uploadLesson',      roles: ['school'] },
  { key: 'school_reports',      icon: BarChart3,       labelKey: 'reports',           roles: ['school'] },
  { key: 'school_settings',     icon: Settings,        labelKey: 'settings',           roles: ['school'] },

  // ── Student ──────────────────────────────────────────────────────
  { key: 'home',            icon: LayoutDashboard, labelKey: 'home',           roles: ['student'] },
  { key: 'lessons',         icon: BookOpen,        labelKey: 'myLessons',      roles: ['student'] },
  { key: 'ai_tutor',        icon: MessageSquare,   labelKey: 'aiTutor',        roles: ['student'] },
  { key: 'student_notif',   icon: Bell,            labelKey: 'notifications',  roles: ['student'] },
  { key: 'student_tickets', icon: Ticket,          labelKey: 'tickets',        roles: ['student'] },

  // ── Admin + Teacher (backwards compatibility) ───────────────────────────
  { key: 'schedules',     icon: CalendarDays,    labelKey: 'schedules',      roles: ['super_admin', 'teacher'] },
  { key: 'quizBuilder',   icon: ClipboardList,   labelKey: 'quizBuilder',    roles: ['super_admin', 'teacher'] },
  { key: 'questionBank',  icon: Database,        labelKey: 'questionBank',   roles: ['super_admin', 'teacher'] },
  { key: 'lessonPlanner', icon: BookMarked,      labelKey: 'lessonPlanner',  roles: ['super_admin', 'teacher'] },

  // ── Teacher only ──────────────────────────────
  { key: 'teacher_home',  icon: LayoutDashboard, labelKey: 'dashboard',      roles: ['teacher'] },
  { key: 'tickets',       icon: Ticket,          labelKey: 'tickets',        roles: ['teacher'] },
  { key: 'consultations', icon: GraduationCap,   labelKey: 'consultations',  roles: ['teacher'] },
  { key: 'studentLogs',   icon: Users,           labelKey: 'studentLogs',    roles: ['teacher'] },
  { key: 'monitoring',    icon: BarChart3,       labelKey: 'monitoringShift',roles: ['teacher'] },
];

export function getNavForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}

export function getDefaultTab(role: UserRole): string {
  const items = getNavForRole(role);
  return items[0]?.key ?? 'dashboard';
}
