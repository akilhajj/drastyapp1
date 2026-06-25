import {
  LayoutDashboard, Users, BookOpen, FileText, Bell, Ticket,
  LogOut, GraduationCap, Globe, BarChart3, Image,
  CalendarDays, ClipboardList, Database, MessageSquare,
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
  // ── Admin only ───────────────────────────────
  { key: 'dashboard',    icon: LayoutDashboard, labelKey: 'dashboard',    roles: ['super_admin'] },
  { key: 'students',     icon: Users,           labelKey: 'students',     roles: ['super_admin'] },
  { key: 'teachers',     icon: GraduationCap,   labelKey: 'teachers',     roles: ['super_admin'] },
  { key: 'curriculum',   icon: FileText,        labelKey: 'curriculum',   roles: ['super_admin'] },
  { key: 'subjects',     icon: BookOpen,        labelKey: 'subjects',     roles: ['super_admin'] },
  { key: 'banners',      icon: Image,           labelKey: 'banners',      roles: ['super_admin'] },
  { key: 'notifications',icon: Bell,            labelKey: 'notifications', roles: ['super_admin'] },
  { key: 'reports',      icon: BarChart3,       labelKey: 'reports',      roles: ['super_admin'] },

  // ── Admin + Teacher ──────────────────────────
  { key: 'schedules',    icon: CalendarDays,    labelKey: 'schedules',    roles: ['super_admin', 'teacher'] },
  { key: 'quizBuilder',  icon: ClipboardList,   labelKey: 'quizBuilder',  roles: ['super_admin', 'teacher'] },
  { key: 'questionBank', icon: Database,        labelKey: 'questionBank', roles: ['super_admin', 'teacher'] },

  // ── Teacher only ─────────────────────────────
  { key: 'teacher_home', icon: LayoutDashboard, labelKey: 'dashboard',    roles: ['teacher'] },
  { key: 'tickets',      icon: Ticket,          labelKey: 'tickets',      roles: ['teacher'] },
  { key: 'consultations',icon: GraduationCap,   labelKey: 'consultations',roles: ['teacher'] },
  { key: 'studentLogs',  icon: Users,           labelKey: 'studentLogs',  roles: ['teacher'] },
  { key: 'monitoring',   icon: BarChart3,       labelKey: 'monitoringShift', roles: ['teacher'] },

  // ── Student only ─────────────────────────────
  { key: 'home',         icon: LayoutDashboard, labelKey: 'home',         roles: ['student'] },
  { key: 'lessons',      icon: BookOpen,        labelKey: 'myLessons',    roles: ['student'] },
  { key: 'student_notif',icon: Bell,            labelKey: 'notifications', roles: ['student'] },
  { key: 'student_tickets', icon: Ticket,       labelKey: 'tickets',      roles: ['student'] },
];

export function getNavForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}

export function getDefaultTab(role: UserRole): string {
  const items = getNavForRole(role);
  return items[0]?.key ?? 'dashboard';
}
