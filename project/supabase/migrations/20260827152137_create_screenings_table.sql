/*
# Create screenings table for RETINOVA DR screening prototype

1. New Tables
- `screenings`
  - `id` (uuid, primary key, auto-generated)
  - `patient_demo_id` (text, synthetic demo ID like DEMO-0001, no real patient data)
  - `screening_date` (timestamptz, when the screening was performed)
  - `image_quality` (text, GOOD or POOR)
  - `quality_score` (integer, 0–100)
  - `dr_grade` (integer, 0–4)
  - `severity` (text, e.g. "No DR", "Mild DR", "Moderate DR", "Severe DR", "Proliferative DR")
  - `confidence` (integer, 0–100)
  - `referable` (boolean, whether grade >= 2)
  - `priority` (text, LOW / MODERATE / HIGH)
  - `review_status` (text, PENDING / CONFIRMED / OVERRIDDEN)
  - `doctor_decision` (text, nullable, CONFIRM / OVERRIDE)
  - `doctor_comment` (text, nullable, doctor's override reason)
  - `reviewer` (text, nullable, reviewer name)
  - `reviewed_at` (timestamptz, nullable, when doctor reviewed)
  - `report` (jsonb, structured LLM screening report)
  - `image_url` (text, nullable, uploaded image data URL or storage path)
  - `gradcam_url` (text, nullable, Grad-CAM heatmap image)
  - `class_probabilities` (jsonb, per-grade probabilities)
  - `model_status` (text, CONNECTED or DEMO_MODE)
  - `processing_time_ms` (integer, model inference time)
  - `created_at` (timestamptz, default now)
  - `updated_at` (timestamptz, default now)

2. Security
- Enable RLS on `screenings`.
- This is a prototype with no authentication — all CRUD is open to anon + authenticated.
- In production, authentication and ownership-scoped policies would be required.

3. Important Notes
- This table stores ONLY synthetic/demo patient IDs. No real patient personal data.
- The `report` jsonb field contains the structured LLM screening report.
- The `class_probabilities` jsonb field stores the 5-grade probability distribution.
- `image_url` may contain a data URL for the prototype; production would use Supabase Storage.
*/

CREATE TABLE IF NOT EXISTS screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_demo_id text NOT NULL,
  screening_date timestamptz NOT NULL DEFAULT now(),
  image_quality text NOT NULL DEFAULT 'GOOD',
  quality_score integer NOT NULL DEFAULT 0,
  dr_grade integer NOT NULL DEFAULT 0,
  severity text NOT NULL DEFAULT 'No DR',
  confidence integer NOT NULL DEFAULT 0,
  referable boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'LOW',
  review_status text NOT NULL DEFAULT 'PENDING',
  doctor_decision text,
  doctor_comment text,
  reviewer text,
  reviewed_at timestamptz,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_url text,
  gradcam_url text,
  class_probabilities jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_status text NOT NULL DEFAULT 'DEMO_MODE',
  processing_time_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;

-- Single-tenant prototype: anon + authenticated can CRUD (no auth in prototype)
DROP POLICY IF EXISTS "anon_select_screenings" ON screenings;
CREATE POLICY "anon_select_screenings" ON screenings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_screenings" ON screenings;
CREATE POLICY "anon_insert_screenings" ON screenings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_screenings" ON screenings;
CREATE POLICY "anon_update_screenings" ON screenings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_screenings" ON screenings;
CREATE POLICY "anon_delete_screenings" ON screenings FOR DELETE
  TO anon, authenticated USING (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_screenings_created_at ON screenings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screenings_review_status ON screenings (review_status);
CREATE INDEX IF NOT EXISTS idx_screenings_dr_grade ON screenings (dr_grade);
