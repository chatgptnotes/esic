-- Create patient_documents table in Supabase Database
-- Copy and paste this SQL in Supabase SQL Editor

-- Create patient_documents table
CREATE TABLE patient_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    document_type_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    file_type TEXT,
    is_uploaded BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT,
    remarks TEXT DEFAULT 'No',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_patient_documents_visit_id ON patient_documents(visit_id);
CREATE INDEX idx_patient_documents_patient_id ON patient_documents(patient_id);
CREATE INDEX idx_patient_documents_type ON patient_documents(document_type_id);

-- Enable Row Level Security (RLS)
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can make this more restrictive later)
CREATE POLICY "Allow all operations on patient_documents" 
ON patient_documents FOR ALL 
USING (true);

-- Add some sample data to test (optional)
-- You can uncomment this if you want test data
/*
INSERT INTO patient_documents (visit_id, patient_id, document_type_id, document_name, file_name, file_path, is_uploaded, remarks) VALUES
('V001', 'P001', 1, 'Referral Letter from ESIC Online Copy', 'referral_letter.pdf', 'demo://referral_letter.pdf', true, 'Yes'),
('V001', 'P001', 2, 'ESIC e-Pendent Card', 'esic_card.jpg', 'demo://esic_card.jpg', true, 'Yes'),
('V001', 'P001', 3, 'Aadhar Card or Other Identity Document', '', '', false, 'No');
*/ 