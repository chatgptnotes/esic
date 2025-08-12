-- Fix junction table foreign key mismatches
-- The junction tables were incorrectly using TEXT for visit_id when they should use UUID
-- to properly reference visits.id (UUID primary key)

-- 1. Fix visit_labs table
ALTER TABLE public.visit_labs DROP CONSTRAINT visit_labs_visit_id_fkey;
ALTER TABLE public.visit_labs ALTER COLUMN visit_id TYPE UUID USING visit_id::UUID;
ALTER TABLE public.visit_labs ADD CONSTRAINT visit_labs_visit_id_fkey 
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;

-- 2. Fix visit_radiology table  
ALTER TABLE public.visit_radiology DROP CONSTRAINT visit_radiology_visit_id_fkey;
ALTER TABLE public.visit_radiology ALTER COLUMN visit_id TYPE UUID USING visit_id::UUID;
ALTER TABLE public.visit_radiology ADD CONSTRAINT visit_radiology_visit_id_fkey 
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;

-- 3. Fix visit_medications table
ALTER TABLE public.visit_medications DROP CONSTRAINT visit_medications_visit_id_fkey;
ALTER TABLE public.visit_medications ALTER COLUMN visit_id TYPE UUID USING visit_id::UUID;
ALTER TABLE public.visit_medications ADD CONSTRAINT visit_medications_visit_id_fkey 
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;

-- 4. Fix visit_surgeries table
ALTER TABLE public.visit_surgeries DROP CONSTRAINT visit_surgeries_visit_id_fkey;
ALTER TABLE public.visit_surgeries ALTER COLUMN visit_id TYPE UUID USING visit_id::UUID;
ALTER TABLE public.visit_surgeries ADD CONSTRAINT visit_surgeries_visit_id_fkey 
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE;

-- Update table comments to reflect the correct schema
COMMENT ON COLUMN public.visit_labs.visit_id IS 'References visits.id (UUID primary key)';
COMMENT ON COLUMN public.visit_radiology.visit_id IS 'References visits.id (UUID primary key)';
COMMENT ON COLUMN public.visit_medications.visit_id IS 'References visits.id (UUID primary key)';
COMMENT ON COLUMN public.visit_surgeries.visit_id IS 'References visits.id (UUID primary key)';