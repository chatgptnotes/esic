-- RADIOLOGY SETUP PART 2: Security Policies and RLS Setup
-- Run this script AFTER Part 1 has been executed successfully

-- Enable RLS (Row Level Security)
ALTER TABLE radiology_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_technologists ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dicom_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiology_qa_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiation_dose_tracking ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust based on your security needs)
CREATE POLICY "Allow all operations" ON radiology_modalities FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_procedures FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiologists FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_technologists FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_appointments FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON dicom_studies FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiology_qa_checks FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON radiation_dose_tracking FOR ALL USING (true);