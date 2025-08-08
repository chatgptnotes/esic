-- RADIOLOGY SETUP PART 1: Extensions, Tables and Structure
-- Copy and paste this script into Supabase SQL Editor first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modalities Table
CREATE TABLE IF NOT EXISTS radiology_modalities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    location VARCHAR(100),
    installation_date DATE,
    calibration_date DATE,
    next_calibration_date DATE,
    is_active BOOLEAN DEFAULT true,
    radiation_type VARCHAR(50),
    max_patients_per_day INTEGER DEFAULT 50,
    avg_study_duration INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Procedures
CREATE TABLE IF NOT EXISTS radiology_procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    modality_id UUID REFERENCES radiology_modalities(id),
    body_part VARCHAR(100),
    study_type VARCHAR(100),
    contrast_required BOOLEAN DEFAULT false,
    contrast_type VARCHAR(100),
    estimated_duration INTEGER DEFAULT 30,
    radiation_dose DECIMAL(10,3),
    preparation_instructions TEXT,
    procedure_steps TEXT,
    price DECIMAL(12,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    cpt_code VARCHAR(10),
    icd_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiologists
CREATE TABLE IF NOT EXISTS radiologists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    license_number VARCHAR(50) UNIQUE,
    specializations TEXT[],
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    digital_signature_path VARCHAR(500),
    reporting_rate INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Technologists
CREATE TABLE IF NOT EXISTS radiology_technologists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(20) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    license_number VARCHAR(50),
    certified_modalities TEXT[],
    hire_date DATE,
    is_active BOOLEAN DEFAULT true,
    shift_timings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Orders
CREATE TABLE IF NOT EXISTS radiology_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    patient_id UUID NOT NULL,
    ordering_physician VARCHAR(200),
    ordering_department VARCHAR(100),
    procedure_id UUID REFERENCES radiology_procedures(id),
    modality_id UUID REFERENCES radiology_modalities(id),
    priority VARCHAR(20) DEFAULT 'routine',
    clinical_indication TEXT,
    clinical_history TEXT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    requested_date DATE,
    contrast_allergies TEXT,
    patient_weight DECIMAL(5,2),
    patient_height DECIMAL(5,2),
    pregnancy_status VARCHAR(20),
    status VARCHAR(30) DEFAULT 'ordered',
    insurance_authorization VARCHAR(100),
    estimated_cost DECIMAL(12,2),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Appointments
CREATE TABLE IF NOT EXISTS radiology_appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES radiology_orders(id),
    appointment_number VARCHAR(20) UNIQUE,
    patient_id UUID NOT NULL,
    modality_id UUID REFERENCES radiology_modalities(id),
    technologist_id UUID REFERENCES radiology_technologists(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    estimated_duration INTEGER DEFAULT 30,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'scheduled',
    patient_arrived_at TIMESTAMP WITH TIME ZONE,
    preparation_completed BOOLEAN DEFAULT false,
    contrast_administered BOOLEAN DEFAULT false,
    contrast_volume DECIMAL(10,2),
    complications TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DICOM Studies
CREATE TABLE IF NOT EXISTS dicom_studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_instance_uid VARCHAR(100) UNIQUE NOT NULL,
    appointment_id UUID REFERENCES radiology_appointments(id),
    order_id UUID REFERENCES radiology_orders(id),
    patient_id UUID NOT NULL,
    study_date DATE NOT NULL,
    study_time TIME,
    modality VARCHAR(10) NOT NULL,
    study_description TEXT,
    accession_number VARCHAR(50),
    referring_physician VARCHAR(200),
    performing_physician VARCHAR(200),
    patient_position VARCHAR(20),
    body_part_examined VARCHAR(100),
    view_position VARCHAR(50),
    series_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    study_size_mb DECIMAL(12,2),
    pacs_location VARCHAR(500),
    archived BOOLEAN DEFAULT false,
    archive_location VARCHAR(500),
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
    technical_adequacy VARCHAR(50),
    artifacts_present BOOLEAN DEFAULT false,
    artifact_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiology Reports
CREATE TABLE IF NOT EXISTS radiology_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_number VARCHAR(20) UNIQUE NOT NULL,
    study_id UUID REFERENCES dicom_studies(id),
    order_id UUID REFERENCES radiology_orders(id),
    patient_id UUID NOT NULL,
    radiologist_id UUID REFERENCES radiologists(id),
    preliminary_radiologist_id UUID REFERENCES radiologists(id),
    report_status VARCHAR(30) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'routine',
    clinical_information TEXT,
    comparison_studies TEXT,
    technique TEXT,
    findings TEXT NOT NULL,
    impression TEXT NOT NULL,
    recommendations TEXT,
    critical_findings TEXT,
    critical_notified BOOLEAN DEFAULT false,
    critical_notification_time TIMESTAMP WITH TIME ZONE,
    critical_notified_to VARCHAR(200),
    dictated_at TIMESTAMP WITH TIME ZONE,
    preliminary_report_time TIMESTAMP WITH TIME ZONE,
    final_report_time TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    amended_at TIMESTAMP WITH TIME ZONE,
    amendment_reason TEXT,
    turnaround_time_minutes INTEGER,
    word_count INTEGER,
    template_used VARCHAR(100),
    structured_reporting JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QA Checks
CREATE TABLE IF NOT EXISTS radiology_qa_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    modality_id UUID REFERENCES radiology_modalities(id),
    qa_type VARCHAR(50) NOT NULL,
    test_name VARCHAR(200) NOT NULL,
    test_date DATE NOT NULL,
    performed_by UUID REFERENCES radiology_technologists(id),
    phantom_used VARCHAR(100),
    test_parameters JSONB,
    measured_values JSONB,
    reference_values JSONB,
    tolerance_limits JSONB,
    pass_fail_status VARCHAR(10) DEFAULT 'pass',
    deviation_percentage DECIMAL(5,2),
    corrective_action TEXT,
    next_test_date DATE,
    supervisor_review BOOLEAN DEFAULT false,
    supervisor_comments TEXT,
    documentation_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Radiation Dose Tracking
CREATE TABLE IF NOT EXISTS radiation_dose_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID REFERENCES dicom_studies(id),
    patient_id UUID NOT NULL,
    modality VARCHAR(10) NOT NULL,
    procedure_name VARCHAR(200),
    dose_length_product DECIMAL(10,3),
    ct_dose_index DECIMAL(10,3),
    effective_dose DECIMAL(10,3),
    entrance_skin_dose DECIMAL(10,3),
    fluoroscopy_time INTEGER,
    kvp INTEGER,
    mas DECIMAL(10,2),
    exposure_factors JSONB,
    body_part VARCHAR(100),
    patient_age INTEGER,
    patient_weight DECIMAL(5,2),
    pregnancy_status VARCHAR(20),
    dose_reference_level DECIMAL(10,3),
    exceeds_drl BOOLEAN DEFAULT false,
    dose_optimization_notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);