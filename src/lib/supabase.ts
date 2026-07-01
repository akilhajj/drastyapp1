import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'super_admin' | 'school' | 'teacher' | 'student';

export type Country = 'syria' | 'lebanon' | 'ksa' | 'uae' | 'iraq' | 'nigeria';

export type GradeLevel = 'primary' | 'preparatory' | 'intermediate' | 'secondary';

export interface School {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country: 'syria' | 'lebanon';
  city?: string;
  max_students_allowed: number;
  current_students_count: number;
  status: 'active' | 'suspended' | 'closed';
  admin_id?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyLesson {
  id: string;
  school_id: string;
  teacher_id?: string;
  title: string;
  content: string;
  target_grade: GradeLevel;
  subject: string;
  country: 'syria' | 'lebanon';
  attached_media: Array<{
    type: 'image' | 'audio';
    data: string;
    caption?: string;
  }>;
  is_active: boolean;
  scheduled_date: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  student_id: string;
  school_id?: string;
  user_message: string;
  ai_response?: string;
  context?: Record<string, unknown>;
  created_at: string;
}

export type CurriculumCategory = 'high_school' | 'middle_school' | 'primary';

export type TargetAudience = 'grade_9' | 'bac_science' | 'bac_literary';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  language: 'ar' | 'en';
  status: 'pending' | 'active' | 'rejected';
  payment_receipt_url?: string;
  payment_notes?: string;
  religion_enabled: boolean;
  religion_choice?: 'islamic' | 'christian';
  religion_prompt_shown: boolean;
  avatar_url?: string;
  specialization?: 'grade_9' | 'bac_science' | 'bac_literary';
  selected_country?: Country;
  grade_track?: string;
  grade_level?: GradeLevel;
  certified_curriculums?: Country[];
  school_id?: string;
  allowed_days?: number;
  branch?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonPlan {
  id: string;
  subject_id: string | null;
  teacher_id: string | null;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  total_minutes: 40 | 60;
  target_audience: TargetAudience[];
  is_published: boolean;
  created_at: string;
}

export interface LessonSubtopic {
  id: string;
  plan_id: string;
  order_index: number;
  title_ar: string;
  title_en: string;
  duration_minutes: number;
  content_ar: string;
  content_en: string;
  image_url: string | null;
  created_at: string;
}

export interface StudentSubtopicProgress {
  id: string;
  student_id: string;
  subtopic_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface Subject {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  order_index: number;
  color_from: string;
  color_to: string;
  icon: string;
  is_religion: boolean;
  is_active: boolean;
  target_audience: TargetAudience[];
}

export interface Lesson {
  id: string;
  subject_id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  video_url?: string;
  order_index: number;
  duration_minutes: number;
  is_active: boolean;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title_ar: string;
  title_en: string;
  passing_score: number;
  time_limit_minutes: number;
  is_active: boolean;
}

export interface HelpTicket {
  id: string;
  student_id: string;
  assigned_teacher_id?: string;
  subject_id?: string;
  title: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'normal' | 'high';
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'student' | 'teacher' | 'super_admin';
  message: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id?: string;
  sender_id?: string;
  is_global: boolean;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  image_url?: string;
  link_url?: string;
  order_index: number;
  is_active: boolean;
}

export interface AiChatLog {
  id: string;
  student_id: string;
  subject_id?: string;
  mode: 'text' | 'voice';
  user_message: string;
  ai_response: string;
  language: 'ar' | 'en';
  created_at: string;
}

export interface CurriculumPdf {
  id: string;
  subject_id: string;
  title_ar: string;
  title_en: string;
  file_url: string;
  file_size_kb?: number;
  version?: string;
  country?: string;
  category?: string;
  grade?: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentLessonProgress {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  watch_percentage: number;
  completed_at?: string;
}

export interface StudentQuizAttempt {
  id: string;
  student_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  manually_unlocked: boolean;
  attempt_number: number;
  created_at: string;
}
