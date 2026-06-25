-- 1. Add specialization to profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='specialization'
  ) THEN
    ALTER TABLE profiles ADD COLUMN specialization text CHECK (
      specialization IN ('grade_9','bac_science','bac_literary')
    );
  END IF;
END $$;

-- 2. Add target_audience to subjects
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='subjects' AND column_name='target_audience'
  ) THEN
    ALTER TABLE subjects ADD COLUMN target_audience text[] NOT NULL DEFAULT '{"grade_9","bac_science","bac_literary"}';
  END IF;
END $$;

-- 3. Lesson plans table
CREATE TABLE IF NOT EXISTS lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id uuid,
  title_ar text NOT NULL,
  title_en text NOT NULL DEFAULT '',
  description_ar text,
  total_minutes integer NOT NULL DEFAULT 40 CHECK (total_minutes IN (40,60)),
  target_audience text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lp_select" ON lesson_plans;
CREATE POLICY "lp_select" ON lesson_plans FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lp_insert" ON lesson_plans;
CREATE POLICY "lp_insert" ON lesson_plans FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lp_update" ON lesson_plans;
CREATE POLICY "lp_update" ON lesson_plans FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "lp_delete" ON lesson_plans;
CREATE POLICY "lp_delete" ON lesson_plans FOR DELETE TO authenticated USING (true);

-- 4. Sub-topics table
CREATE TABLE IF NOT EXISTS lesson_subtopics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  title_ar text NOT NULL,
  title_en text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 10,
  content_ar text NOT NULL DEFAULT '',
  content_en text NOT NULL DEFAULT '',
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lesson_subtopics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lst_select" ON lesson_subtopics;
CREATE POLICY "lst_select" ON lesson_subtopics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lst_insert" ON lesson_subtopics;
CREATE POLICY "lst_insert" ON lesson_subtopics FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "lst_update" ON lesson_subtopics;
CREATE POLICY "lst_update" ON lesson_subtopics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "lst_delete" ON lesson_subtopics;
CREATE POLICY "lst_delete" ON lesson_subtopics FOR DELETE TO authenticated USING (true);

-- 5. Track student progress through subtopics
CREATE TABLE IF NOT EXISTS student_subtopic_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  subtopic_id uuid NOT NULL REFERENCES lesson_subtopics(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(student_id, subtopic_id)
);

ALTER TABLE student_subtopic_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ssp_select" ON student_subtopic_progress;
CREATE POLICY "ssp_select" ON student_subtopic_progress FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ssp_insert" ON student_subtopic_progress;
CREATE POLICY "ssp_insert" ON student_subtopic_progress FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "ssp_update" ON student_subtopic_progress;
CREATE POLICY "ssp_update" ON student_subtopic_progress FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject ON lesson_plans(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_subtopics_plan ON lesson_subtopics(plan_id);
CREATE INDEX IF NOT EXISTS idx_ssp_student ON student_subtopic_progress(student_id);
