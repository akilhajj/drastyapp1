/*
# Multi-Country Architecture & Curriculum Segregation

## Overview
Extends the platform to support students and teachers from multiple countries
with segregated curriculum data. Adds country-specific registration fields and
isolated curriculum file storage.

## Changes

### 1. profiles — new columns
- `selected_country`: country the student/teacher belongs to (e.g. 'syria', 'ksa', 'uae', 'iraq', 'nigeria')
- `grade_track`: academic level local nomenclature per country
- `certified_curriculums`: text array of countries the teacher is certified to teach
- `phone_number`: explicit phone number (existing phone column is preserved)

### 2. curriculum_pdfs — new columns
- `country`: target country for the file
- `category`: 'high_school' | 'middle_school' | 'primary'
- `grade`: specific grade level
- `subject_id` already exists for subject reference

### 3. Security
- RLS policies are not changed for new columns since they are metadata
- Existing RLS policies remain effective
*/

-- ─── PROFILES: country / grade / phone / certified_curriculums ───────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='selected_country'
  ) THEN
    ALTER TABLE profiles ADD COLUMN selected_country text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='grade_track'
  ) THEN
    ALTER TABLE profiles ADD COLUMN grade_track text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='certified_curriculums'
  ) THEN
    ALTER TABLE profiles ADD COLUMN certified_curriculums text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='profiles' AND column_name='phone_number'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone_number text;
  END IF;
END $$;

-- ─── CURRICULUM_PDFS: country / category / grade for tenant isolation ───────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='curriculum_pdfs' AND column_name='country'
  ) THEN
    ALTER TABLE curriculum_pdfs ADD COLUMN country text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='curriculum_pdfs' AND column_name='category'
  ) THEN
    ALTER TABLE curriculum_pdfs ADD COLUMN category text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='curriculum_pdfs' AND column_name='grade'
  ) THEN
    ALTER TABLE curriculum_pdfs ADD COLUMN grade text;
  END IF;
END $$;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(selected_country);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_track ON profiles(grade_track);
CREATE INDEX IF NOT EXISTS idx_curriculum_pdfs_country ON curriculum_pdfs(country);
CREATE INDEX IF NOT EXISTS idx_curriculum_pdfs_category ON curriculum_pdfs(category);
CREATE INDEX IF NOT EXISTS idx_curriculum_pdfs_grade ON curriculum_pdfs(grade);
