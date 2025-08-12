-- 🚨 URGENT: Add Missing Columns to Medical Tables
-- Copy-paste this ENTIRE script in Supabase SQL Editor and RUN

-- ==========================================
-- 1. Add CRITICAL columns to visit_labs
-- ==========================================
ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ordered';

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS result_value TEXT;

ALTER TABLE public.visit_labs 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==========================================
-- 2. Add CRITICAL columns to visit_radiology
-- ==========================================
ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ordered';

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS findings TEXT;

ALTER TABLE public.visit_radiology 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==========================================
-- 3. Add CRITICAL columns to visit_medications
-- ==========================================
ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS medication_type TEXT DEFAULT 'other';

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prescribed';

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS route TEXT DEFAULT 'oral';

ALTER TABLE public.visit_medications 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- ==========================================
-- 4. Verify columns were added
-- ==========================================
-- Check visit_labs columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'visit_labs' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- Check visit_radiology columns  
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'visit_radiology' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- Check visit_medications columns
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'visit_medications' AND table_schema = 'public' 
ORDER BY ordinal_position;