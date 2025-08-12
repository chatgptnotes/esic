-- SQL Script to Add Missing Columns to Junction Tables
-- Run this in your Supabase SQL Editor

-- ==========================================
-- 1. Add missing columns to visit_labs table
-- ==========================================

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ordered' CHECK (status IN ('ordered', 'collected', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS collected_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS result_value TEXT;

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS normal_range TEXT;

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- ==========================================
-- 2. Add missing columns to visit_radiology table  
-- ==========================================

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ordered' CHECK (status IN ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS completed_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS findings TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS impression TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- ==========================================
-- 3. Add missing columns to visit_medications table
-- ==========================================

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS medication_type TEXT DEFAULT 'other' CHECK (medication_type IN ('antibiotic', 'other'));

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS route TEXT DEFAULT 'oral' CHECK (route IN ('oral', 'iv', 'im', 'topical', 'other'));

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prescribed' CHECK (status IN ('prescribed', 'dispensed', 'completed', 'discontinued'));

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- ==========================================
-- 4. Add indexes for better performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_visit_labs_status ON public.visit_labs(status);
CREATE INDEX IF NOT EXISTS idx_visit_radiology_status ON public.visit_radiology(status);
CREATE INDEX IF NOT EXISTS idx_visit_medications_type ON public.visit_medications(medication_type);
CREATE INDEX IF NOT EXISTS idx_visit_medications_status ON public.visit_medications(status);

-- ==========================================
-- 5. Create triggers to automatically update updated_at timestamp
-- ==========================================

CREATE OR REPLACE FUNCTION update_visit_medical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_visit_labs_updated_at
  BEFORE UPDATE ON public.visit_labs
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_update_visit_radiology_updated_at
  BEFORE UPDATE ON public.visit_radiology
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_update_visit_medications_updated_at
  BEFORE UPDATE ON public.visit_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

-- ==========================================
-- 6. Verify the columns were added (optional)
-- ==========================================

-- You can run these queries to verify the columns exist:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'visit_labs' AND table_schema = 'public' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'visit_radiology' AND table_schema = 'public' ORDER BY ordinal_position;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'visit_medications' AND table_schema = 'public' ORDER BY ordinal_position;