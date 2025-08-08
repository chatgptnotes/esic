-- RADIOLOGY SETUP PART 3: Sample Data Inserts
-- Run this script AFTER Parts 1 and 2 have been executed successfully

-- Insert sample data
INSERT INTO radiology_modalities (name, code, description, manufacturer, model, location, is_active, radiation_type, max_patients_per_day) VALUES
('Computed Tomography Scanner', 'CT', '64-slice CT scanner for routine and emergency imaging', 'Siemens', 'SOMATOM Definition Flash', 'Radiology Wing - Room 101', true, 'ionizing', 60),
('Magnetic Resonance Imaging', 'MRI', '3T MRI system for detailed soft tissue imaging', 'GE Healthcare', 'SIGNA Pioneer', 'Radiology Wing - Room 102', true, 'non-ionizing', 35),
('Digital Radiography', 'XR', 'Digital X-ray system for general radiography', 'Philips', 'DigitalDiagnost C90', 'Radiology Wing - Room 103', true, 'ionizing', 80),
('Ultrasound Scanner', 'US', 'High-end ultrasound system for abdominal and obstetric imaging', 'Samsung', 'RS85', 'Radiology Wing - Room 104', true, 'non-ionizing', 50),
('Mammography Unit', 'MG', 'Digital mammography system for breast cancer screening', 'Hologic', 'Selenia Dimensions', 'Radiology Wing - Room 105', true, 'ionizing', 25),
('Fluoroscopy Unit', 'FL', 'C-arm fluoroscopy for interventional procedures', 'Philips', 'Azurion 7', 'Radiology Wing - Room 106', true, 'ionizing', 20)
ON CONFLICT (code) DO NOTHING;

-- Insert sample radiologists
INSERT INTO radiologists (employee_id, first_name, last_name, email, specializations, is_active) VALUES
('RAD001', 'Dr. Rajesh', 'Kumar', 'rajesh.kumar@hospital.com', ARRAY['Neuroradiology', 'Emergency Radiology'], true),
('RAD002', 'Dr. Priya', 'Sharma', 'priya.sharma@hospital.com', ARRAY['Musculoskeletal', 'Sports Medicine'], true),
('RAD003', 'Dr. Amit', 'Patel', 'amit.patel@hospital.com', ARRAY['Cardiac Imaging', 'Thoracic Radiology'], true),
('RAD004', 'Dr. Sunita', 'Reddy', 'sunita.reddy@hospital.com', ARRAY['Breast Imaging', 'Women''s Imaging'], true)
ON CONFLICT (employee_id) DO NOTHING;

-- Insert sample technologists
INSERT INTO radiology_technologists (employee_id, first_name, last_name, email, certified_modalities, is_active) VALUES
('TECH001', 'Ravi', 'Singh', 'ravi.singh@hospital.com', ARRAY['CT', 'XR'], true),
('TECH002', 'Meena', 'Joshi', 'meena.joshi@hospital.com', ARRAY['MRI'], true),
('TECH003', 'Suresh', 'Gupta', 'suresh.gupta@hospital.com', ARRAY['US', 'MG'], true),
('TECH004', 'Kavita', 'Rao', 'kavita.rao@hospital.com', ARRAY['CT', 'FL'], true)
ON CONFLICT (employee_id) DO NOTHING;