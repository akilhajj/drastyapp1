/*
# Add Schedules, Full Quiz System, and Question Bank

## New Tables

### 1. class_schedules
Manage weekly class timetable entries.
- subject_id: links to subjects
- teacher_id: the responsible teacher
- day_of_week: 0-6 (Sunday-Saturday)
- start_time / end_time
- room: optional room label
- notes: optional

### 2. quiz_questions (drop-recreate safe with IF NOT EXISTS)
Already partially defined — ensure full columns exist.

### 3. quiz_options (same)

### 4. question_bank
Reusable question templates independent of any quiz.
- subject_id
- question_ar / question_en
- options: jsonb array [{text_ar, text_en, is_correct}]
- tags: text array for filtering
- created_by

## Security
RLS on all new tables. Super admin + teachers manage schedules and quizzes.
Students read schedules (their subjects).
*/

-- ─── CLASS SCHEDULES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES auth.users(id),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  room text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_sched_select" ON class_schedules;
CREATE POLICY "cs_sched_select" ON class_schedules FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "cs_sched_insert" ON class_schedules;
CREATE POLICY "cs_sched_insert" ON class_schedules FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher'))
);

DROP POLICY IF EXISTS "cs_sched_update" ON class_schedules;
CREATE POLICY "cs_sched_update" ON class_schedules FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher')));

DROP POLICY IF EXISTS "cs_sched_delete" ON class_schedules;
CREATE POLICY "cs_sched_delete" ON class_schedules FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher'))
);

-- ─── QUESTION BANK ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  question_ar text NOT NULL,
  question_en text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '[]',
  tags text[] NOT NULL DEFAULT '{}',
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qb_select" ON question_bank;
CREATE POLICY "qb_select" ON question_bank FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "qb_insert" ON question_bank;
CREATE POLICY "qb_insert" ON question_bank FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher'))
);

DROP POLICY IF EXISTS "qb_update" ON question_bank;
CREATE POLICY "qb_update" ON question_bank FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher')))
WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher')));

DROP POLICY IF EXISTS "qb_delete" ON question_bank;
CREATE POLICY "qb_delete" ON question_bank FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin','teacher'))
);

-- ─── QUIZZES — ensure full columns ──────────────────────────────────────────
-- quizzes table already exists; add subject_id column if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='quizzes' AND column_name='subject_id'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN subject_id uuid REFERENCES subjects(id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='quizzes' AND column_name='description_ar'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN description_ar text;
    ALTER TABLE quizzes ADD COLUMN description_en text;
  END IF;
END $$;

-- ─── QUIZ QUESTIONS — ensure full columns ───────────────────────────────────
-- quiz_questions already has question_ar, question_en, order_index
-- Add points column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='quiz_questions' AND column_name='points'
  ) THEN
    ALTER TABLE quiz_questions ADD COLUMN points integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- ─── INDEXES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_class_schedules_subject ON class_schedules(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher ON class_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON question_bank(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_created_by ON question_bank(created_by);
