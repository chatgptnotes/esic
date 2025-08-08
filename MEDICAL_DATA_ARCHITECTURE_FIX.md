# Medical Data Architecture Fix

## Problem
Medical data (labs, radiology, antibiotics, medications) was incorrectly stored in the main `patients` table, which violates proper database normalization and the intended architecture.

## Solution
Medical data should ONLY be stored in junction tables for visit-specific tracking:

### Junction Tables (Correct Architecture)
- `visit_labs` - Links visits to lab tests
- `visit_radiology` - Links visits to radiology studies  
- `visit_medications` - Links visits to medications (including antibiotics)

### Changes Made

#### 1. Database Schema Fix
- **File**: `remove_medical_fields_from_patients.sql`
- **Action**: Removes medical data columns from patients table:
  - `labs_radiology`
  - `antibiotics` 
  - `other_medications`
  - `labs`
  - `radiology`

#### 2. Code Updates
- **PatientCard.tsx**: 
  - Removed medical data display sections
  - Updated interface to remove medical fields
  - Added informational message directing users to Investigations tab
  - Updated print function to remove medical data sections

- **src/types/patient.ts**:
  - Removed medical data fields from Patient interface
  - Added comment explaining junction table architecture

- **src/pages/Index.tsx**:
  - Removed medical data fields from search functionality

#### 3. Data Flow (Correct Architecture)
```
Patient Registration → patients table (demographics, basic info)
Visit Registration → visits table (visit details)
Medical Data Entry → Junction tables:
  - visit_labs (lab tests per visit)
  - visit_radiology (radiology studies per visit) 
  - visit_medications (medications per visit)
```

### Benefits
1. **Proper Normalization**: Medical data is visit-specific, not patient-specific
2. **Data Integrity**: Each visit can have different medical requirements
3. **Scalability**: Can track multiple visits per patient with different medical data
4. **Status Tracking**: Junction tables support workflow status (ordered, completed, etc.)
5. **Detailed Tracking**: Each medical item can have individual status, dates, results

### Migration Steps
1. Run `remove_medical_fields_from_patients.sql` in Supabase
2. Ensure junction tables exist (they should already be created)
3. Update application code (already done)
4. Test medical data entry via Investigations tab

### Important Notes
- **Legacy Data**: Any existing medical data in patients table will be lost when columns are dropped
- **New Workflow**: Medical data should be entered via the Investigations tab for each visit
- **Junction Tables**: Already exist and are properly configured with foreign keys and RLS policies

### Verification
After migration, verify:
- [ ] Medical data columns removed from patients table
- [ ] Junction tables exist and are accessible
- [ ] Investigations tab works for medical data entry
- [ ] PatientCard no longer shows legacy medical data fields
- [ ] Search functionality works without medical data fields 