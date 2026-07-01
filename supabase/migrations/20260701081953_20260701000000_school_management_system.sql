/*
# Sovereign Cross-Border Private School Management System
## Syria & Lebanon Multi-Tenant Architecture

### Overview
Complete multi-tenant school management platform supporting:
- Supreme Admin (platform owner) - manages schools globally
- School Administrator - manages their school's students and lessons  
- Student - accesses lessons and AI tutor

### Core Features
- School quotas and seat management
- Manual lesson injection with media (images, voice recordings)
- Country-based curriculum filtering (Syria, Lebanon)
- Grade level targeting (Primary, Preparatory, Intermediate, Secondary)
*/

-- ============================================================
-- SCHOOLS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  country text NOT NULL CHECK (country IN ('syria', 'lebanon')),
  city text,
  max_students_allowed integer NOT NULL DEFAULT 100,
  current_students_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schools_select" ON schools;
CREATE POLICY "schools_select" ON schools FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "schools_insert" ON schools;
CREATE POLICY "schools_insert" ON schools FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

DROP POLICY IF EXISTS "schools_update" ON schools;
CREATE POLICY "schools_update" ON schools FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school'))
);

DROP POLICY IF EXISTS "schools_delete" ON schools;
CREATE POLICY "schools_delete" ON schools FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
);

-- ============================================================
-- UPDATE PROFILES TABLE FOR SCHOOL SYSTEM
-- ============================================================

-- Add school_id column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='school_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN school_id uuid REFERENCES schools(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update role to include 'school' admin role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'school', 'teacher', 'student'));

-- Add grade level column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='grade_level'
  ) THEN
    ALTER TABLE profiles ADD COLUMN grade_level text 
      CHECK (grade_level IN ('primary', 'preparatory', 'intermediate', 'secondary'));
  END IF;
END $$;

-- Add allowed days/quota for students
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='allowed_days'
  ) THEN
    ALTER TABLE profiles ADD COLUMN allowed_days integer DEFAULT 30;
  END IF;
END $$;

-- Add branch field
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='branch'
  ) THEN
    ALTER TABLE profiles ADD COLUMN branch text;
  END IF;
END $$;

-- ============================================================
-- DAILY LESSONS TABLE (Manual Lesson Injection)
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  target_grade text NOT NULL CHECK (target_grade IN ('primary', 'preparatory', 'intermediate', 'secondary')),
  subject text NOT NULL,
  country text NOT NULL CHECK (country IN ('syria', 'lebanon')),
  attached_media jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  scheduled_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_lessons_select" ON daily_lessons;
CREATE POLICY "daily_lessons_select" ON daily_lessons FOR SELECT
TO authenticated USING (
  (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'student' AND p.school_id = daily_lessons.school_id))
  OR
  (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'school' AND p.school_id = daily_lessons.school_id))
  OR
  (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
  OR
  (auth.uid() = daily_lessons.teacher_id)
);

DROP POLICY IF EXISTS "daily_lessons_insert" ON daily_lessons;
CREATE POLICY "daily_lessons_insert" ON daily_lessons FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school', 'teacher'))
);

DROP POLICY IF EXISTS "daily_lessons_update" ON daily_lessons;
CREATE POLICY "daily_lessons_update" ON daily_lessons FOR UPDATE
TO authenticated USING (
  (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school')))
  OR auth.uid() = daily_lessons.teacher_id
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school', 'teacher'))
);

DROP POLICY IF EXISTS "daily_lessons_delete" ON daily_lessons;
CREATE POLICY "daily_lessons_delete" ON daily_lessons FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school'))
);

-- ============================================================
-- CHAT MESSAGES TABLE (AI Tutor interactions)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  user_message text NOT NULL,
  ai_response text,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_select" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT
TO authenticated USING (
  auth.uid() = student_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school'))
);

DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT
TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "chat_messages_update" ON chat_messages;
CREATE POLICY "chat_messages_update" ON chat_messages FOR UPDATE
TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "chat_messages_delete" ON chat_messages;
CREATE POLICY "chat_messages_delete" ON chat_messages FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'school'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_schools_country ON schools(country);
CREATE INDEX IF NOT EXISTS idx_schools_admin ON schools(admin_id);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_school ON daily_lessons(school_id);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_target_grade ON daily_lessons(target_grade);
CREATE INDEX IF NOT EXISTS idx_daily_lessons_scheduled ON daily_lessons(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_student ON chat_messages(student_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_school ON chat_messages(school_id);

-- ============================================================
-- FUNCTION TO UPDATE SCHOOL STUDENT COUNT
-- ============================================================
CREATE OR REPLACE FUNCTION update_school_student_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.school_id IS NOT NULL AND NEW.role = 'student' THEN
      UPDATE schools 
      SET current_students_count = current_students_count + 1 
      WHERE id = NEW.school_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.school_id IS NOT NULL AND OLD.role = 'student' THEN
      UPDATE schools 
      SET current_students_count = current_students_count - 1 
      WHERE id = OLD.school_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.school_id IS DISTINCT FROM NEW.school_id THEN
      IF OLD.school_id IS NOT NULL AND OLD.role = 'student' THEN
        UPDATE schools 
        SET current_students_count = current_students_count - 1 
        WHERE id = OLD.school_id;
      END IF;
      IF NEW.school_id IS NOT NULL AND NEW.role = 'student' THEN
        UPDATE schools 
        SET current_students_count = current_students_count + 1 
        WHERE id = NEW.school_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_student_count ON profiles;
CREATE TRIGGER trigger_update_student_count
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_school_student_count();

-- ============================================================
-- SEED SAMPLE SCHOOLS
-- ============================================================
INSERT INTO schools (name, email, phone, country, city, max_students_allowed, status)
VALUES
  ('المدرسة الأكاديمية السورية', 'info@syrian-academy.edu', '+963 11 123 4567', 'syria', 'دمشق', 200, 'active'),
  ('مؤسسة النور التعليمية', 'admin@alnoor-edu.lb', '+961 1 234 567', 'lebanon', 'بيروت', 150, 'active'),
  ('مدارس المستقبل', 'contact@future-schools.edu', '+963 11 987 654', 'syria', 'حلب', 100, 'active')
ON CONFLICT (email) DO NOTHING;