-- URGENT FIX: Create missing junction tables for visit medical data
-- 
-- INSTRUCTIONS:
-- 1. Copy this entire SQL script
-- 2. Go to your Supabase Dashboard > SQL Editor
-- 3. Paste and run this script
-- 4. This will create the missing junction tables that are preventing 
--    the VisitRegistrationForm from working properly
--
-- PROBLEM SUMMARY:
-- The junction tables (visit_labs, visit_radiology, visit_medications) 
-- don't exist in the database, causing insert operations to fail silently.
-- This script creates them with the correct schema.

-- Drop existing tables if they exist (for clean recreation)
DROP TABLE IF EXISTS public.visit_labs CASCADE;
DROP TABLE IF EXISTS public.visit_radiology CASCADE;
DROP TABLE IF EXISTS public.visit_medications CASCADE;

-- 1. Create visit_labs junction table
CREATE TABLE public.visit_labs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES public.lab(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ordered' CHECK (status IN ('ordered', 'collected', 'in_progress', 'completed', 'cancelled')),
  ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  collected_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  result_value TEXT,
  normal_range TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, lab_id)
);

-- 2. Create visit_radiology junction table
CREATE TABLE public.visit_radiology (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  radiology_id UUID NOT NULL REFERENCES public.radiology(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'ordered' CHECK (status IN ('ordered', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  ordered_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  findings TEXT,
  impression TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, radiology_id)
);

-- 3. Create visit_medications junction table
CREATE TABLE public.visit_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL REFERENCES public.medication(id) ON DELETE CASCADE,
  medication_type TEXT DEFAULT 'other' CHECK (medication_type IN ('antibiotic', 'other')),
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  route TEXT DEFAULT 'oral' CHECK (route IN ('oral', 'iv', 'im', 'topical', 'other')),
  status TEXT DEFAULT 'prescribed' CHECK (status IN ('prescribed', 'dispensed', 'completed', 'discontinued')),
  prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(visit_id, medication_id, medication_type)
);

-- Create indexes for performance
CREATE INDEX idx_visit_labs_visit_id ON public.visit_labs(visit_id);
CREATE INDEX idx_visit_labs_lab_id ON public.visit_labs(lab_id);
CREATE INDEX idx_visit_labs_status ON public.visit_labs(status);

CREATE INDEX idx_visit_radiology_visit_id ON public.visit_radiology(visit_id);
CREATE INDEX idx_visit_radiology_radiology_id ON public.visit_radiology(radiology_id);
CREATE INDEX idx_visit_radiology_status ON public.visit_radiology(status);

CREATE INDEX idx_visit_medications_visit_id ON public.visit_medications(visit_id);
CREATE INDEX idx_visit_medications_medication_id ON public.visit_medications(medication_id);
CREATE INDEX idx_visit_medications_type ON public.visit_medications(medication_type);
CREATE INDEX idx_visit_medications_status ON public.visit_medications(status);

-- Enable Row Level Security
ALTER TABLE public.visit_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_radiology ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_medications ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on visit labs" ON public.visit_labs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on visit radiology" ON public.visit_radiology
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on visit medications" ON public.visit_medications
  FOR ALL USING (true) WITH CHECK (true);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_visit_medical_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updated_at
CREATE TRIGGER trigger_update_visit_labs_updated_at
  BEFORE UPDATE ON public.visit_labs
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

CREATE TRIGGER trigger_update_visit_radiology_updated_at
  BEFORE UPDATE ON public.visit_radiology
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

CREATE TRIGGER trigger_update_visit_medications_updated_at
  BEFORE UPDATE ON public.visit_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_medical_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.visit_labs IS 'Junction table for tracking individual lab tests per visit';
COMMENT ON TABLE public.visit_radiology IS 'Junction table for tracking individual radiology studies per visit';
COMMENT ON TABLE public.visit_medications IS 'Junction table for tracking individual medications per visit';

-- SUCCESS MESSAGE
-- If this script runs successfully, the junction tables are now created
-- and the VisitRegistrationForm should be able to insert lab, radiology, 
-- and medication records properly.

-- IMPORTANT NOTES:
-- 1. The junction tables use visit_id as UUID (not TEXT) to properly 
--    reference visits.id (the UUID primary key)
-- 2. The VisitRegistrationForm.tsx code is already correct - it uses 
--    dbVisitUUID which is the UUID primary key
-- 3. After running this script, test the form to ensure junction table 
--    inserts work properly