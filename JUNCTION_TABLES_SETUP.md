# Junction Tables Setup for Bills Diagnoses, Surgeries, and Pharmacy

## Overview

This document provides instructions for setting up the junction tables required for the diagnosis, CGHS surgery, and pharmacy functionality in the Final Bill page.

## Required Tables

### 1. bills_diagnoses
Junction table linking bills to diagnoses

### 2. bills_surgeries
Junction table linking bills to CGHS surgeries

### 3. bills_pharmacy
Junction table storing pharmacy/medication items for bills

## Database Setup Instructions

### Step 1: Create Tables in Supabase Dashboard

Copy and paste the following SQL in your Supabase SQL Editor:

```sql
-- 1. Bills Diagnoses Junction Table
CREATE TABLE IF NOT EXISTS public.bills_diagnoses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  diagnosis_id UUID NOT NULL REFERENCES public.diagnoses(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bill_id, diagnosis_id)
);

-- 2. Bills Surgeries Junction Table  
CREATE TABLE IF NOT EXISTS public.bills_surgeries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  surgery_id UUID NOT NULL REFERENCES public.cghs_surgery(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  sanction_status TEXT DEFAULT 'Not Sanctioned' CHECK (sanction_status IN ('Sanctioned', 'Not Sanctioned')),
  notes TEXT,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  performed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(bill_id, surgery_id)
);

-- 3. Bills Pharmacy Junction Table
CREATE TABLE IF NOT EXISTS public.bills_pharmacy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  medication_code TEXT,
  batch_no TEXT,
  expiry_date DATE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  administration_date DATE,
  administration_time TIME,
  instructions TEXT,
  external_requisition TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bills_diagnoses_bill_id ON public.bills_diagnoses(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_diagnoses_diagnosis_id ON public.bills_diagnoses(diagnosis_id);
CREATE INDEX IF NOT EXISTS idx_bills_surgeries_bill_id ON public.bills_surgeries(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_surgeries_surgery_id ON public.bills_surgeries(surgery_id);
CREATE INDEX IF NOT EXISTS idx_bills_pharmacy_bill_id ON public.bills_pharmacy(bill_id);
CREATE INDEX IF NOT EXISTS idx_bills_pharmacy_medication_name ON public.bills_pharmacy(medication_name);
CREATE INDEX IF NOT EXISTS idx_bills_pharmacy_administration_date ON public.bills_pharmacy(administration_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.bills_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_surgeries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills_pharmacy ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Allow all operations on bills_diagnoses" ON public.bills_diagnoses
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on bills_surgeries" ON public.bills_surgeries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on bills_pharmacy" ON public.bills_pharmacy
  FOR ALL USING (true) WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.bills_diagnoses IS 'Junction table linking bills to diagnoses';
COMMENT ON TABLE public.bills_surgeries IS 'Junction table linking bills to CGHS surgeries';
COMMENT ON TABLE public.bills_pharmacy IS 'Junction table storing pharmacy/medication items for bills';
COMMENT ON COLUMN public.bills_diagnoses.is_primary IS 'Indicates if this is the primary diagnosis for the bill';
COMMENT ON COLUMN public.bills_surgeries.is_primary IS 'Indicates if this is the primary surgery for the bill';
COMMENT ON COLUMN public.bills_pharmacy.administration_date IS 'Date when medication was administered';
COMMENT ON COLUMN public.bills_pharmacy.administration_time IS 'Time when medication was administered';
COMMENT ON COLUMN public.bills_pharmacy.total_amount IS 'Total cost for this medication (quantity * unit_price)';
```

### Step 2: Verify Tables Creation

Run this query to verify the tables were created successfully:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bills_diagnoses', 'bills_surgeries');
```

## Features Implemented

### Diagnosis Search & Selection
- ✅ Real-time search from `diagnoses` table
- ✅ Search by name and description
- ✅ Selected diagnoses display with remove functionality
- ✅ Save to `bills_diagnoses` junction table
- ✅ Primary diagnosis marking (first selected)

### CGHS Surgery Search & Selection
- ✅ Real-time search from `cghs_surgery` table
- ✅ Search by name and code
- ✅ Display surgery details (name, code, NABH rate)
- ✅ Selected surgeries display with remove functionality
- ✅ Save to `bills_surgeries` junction table
- ✅ Primary surgery marking (first selected)

### Pharmacy/Medication Management
- ✅ Search and select medications from pharmacy services
- ✅ Editable fields for each medication (date, time, name, amount, etc.)
- ✅ Individual medication display with alternating row colors
- ✅ Total amount calculation and display
- ✅ Save to `bills_pharmacy` junction table
- ✅ Comprehensive medication data storage (batch, expiry, instructions)

## Usage Instructions

1. **Search Diagnoses**: Type in the diagnosis search field (minimum 2 characters)
2. **Select Diagnoses**: Click on any diagnosis from the dropdown to add it
3. **Remove Diagnoses**: Click the X button on selected diagnosis cards
4. **Save Diagnoses**: Click "Save Diagnoses to Bill" button

5. **Search Surgeries**: Type in the CGHS surgery search field (minimum 2 characters)  
6. **Select Surgeries**: Click on any surgery from the dropdown to add it
7. **Remove Surgeries**: Click the X button on selected surgery cards
8. **Save Surgeries**: Click "Save Surgeries to Bill" button

9. **Select Medications**: Click on any medication from the pharmacy dropdown to add it
10. **Edit Medication Details**: Modify date, time, name, amount, and other fields as needed
11. **Remove Medications**: Click the delete button on selected medication rows
12. **Save Medications**: Click "Save Medications to Bill" button

## Data Structure

### bills_diagnoses Table
- `bill_id`: References bills.id
- `diagnosis_id`: References diagnoses.id  
- `is_primary`: Boolean indicating primary diagnosis
- `notes`: Optional notes

### bills_surgeries Table
- `bill_id`: References bills.id
- `surgery_id`: References cghs_surgery.id
- `is_primary`: Boolean indicating primary surgery
- `status`: Surgery status (planned, in_progress, completed, cancelled)
- `sanction_status`: Administrative status (Sanctioned, Not Sanctioned)
- `notes`: Optional notes
- `scheduled_date`: When surgery is scheduled
- `performed_date`: When surgery was performed

### bills_pharmacy Table
- `bill_id`: References bills.id
- `medication_name`: Name of the medication
- `medication_code`: Code/SKU of the medication
- `batch_no`: Batch number for tracking
- `expiry_date`: Medication expiry date
- `quantity`: Number of units administered
- `unit_price`: Price per unit
- `total_amount`: Total cost (quantity * unit_price)
- `administration_date`: Date medication was given
- `administration_time`: Time medication was given
- `instructions`: Dosage and administration instructions
- `external_requisition`: External requisition reference
- `notes`: Additional notes

## Next Steps

1. Create the tables using the SQL above
2. Update Supabase TypeScript types if needed
3. Test the functionality in the Final Bill page
4. Integrate with actual bill IDs (currently using mock IDs)
5. Add data loading functionality to populate existing selections when editing bills
