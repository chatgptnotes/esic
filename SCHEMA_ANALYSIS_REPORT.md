# Junction Tables Schema Analysis Report

## Issue Summary

The test `test_medical_data_storage.js` is failing because the junction tables (`visit_labs`, `visit_radiology`, `visit_medications`) exist in the database but are missing many essential columns defined in the migration file.

## Current vs Expected Schema

### 1. visit_labs Table

**Current Columns (4/12):**
- `id` ✅
- `visit_id` ✅ 
- `lab_id` ✅
- `created_at` ✅

**Missing Columns (8/12):**
- `status` ❌
- `ordered_date` ❌ 
- `collected_date` ❌
- `completed_date` ❌
- `result_value` ❌
- `normal_range` ❌
- `notes` ❌
- `updated_at` ❌

### 2. visit_radiology Table

**Current Columns (4/12):**
- `id` ✅
- `visit_id` ✅
- `radiology_id` ✅
- `created_at` ✅

**Missing Columns (8/12):**
- `status` ❌
- `ordered_date` ❌
- `scheduled_date` ❌
- `completed_date` ❌
- `findings` ❌
- `impression` ❌
- `notes` ❌
- `updated_at` ❌

### 3. visit_medications Table

**Current Columns (7/15):**
- `id` ✅
- `visit_id` ✅
- `medication_id` ✅
- `dosage` ✅
- `frequency` ✅
- `duration` ✅
- `created_at` ✅

**Missing Columns (8/15):**
- `medication_type` ❌
- `route` ❌
- `status` ❌
- `prescribed_date` ❌
- `start_date` ❌
- `end_date` ❌
- `notes` ❌
- `updated_at` ❌

## Root Cause

The migration file `supabase/migrations/20250614230000_create_visit_medical_junction_tables.sql` contains the complete schema definition with all required columns, but this migration has not been applied to the remote Supabase database.

## Solution Required

You need to apply the migration `20250614230000_create_visit_medical_junction_tables.sql` to your Supabase database. This can be done through:

1. **Supabase Dashboard** (Recommended):
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the contents of the migration file

2. **Supabase CLI** (if you have admin access):
   ```bash
   supabase db push
   ```

## Files Analyzed

- ✅ `/Users/murali/adamrit.com 13 june 2.30 pm/esic-patient-mapper/supabase/migrations/20250614230000_create_visit_medical_junction_tables.sql` - Contains correct schema
- ✅ `/Users/murali/adamrit.com 13 june 2.30 pm/esic-patient-mapper/test_medical_data_storage.js` - Test expects full schema
- ✅ Remote database - Contains tables with minimal schema

## Test Errors Explained

The specific errors you encountered:

```
Could not find the 'ordered_date' column of 'visit_labs' in the schema cache
Could not find the 'medication_type' column of 'visit_medications' in the schema cache  
column visit_labs.status does not exist
column visit_radiology.status does not exist
column visit_medications.status does not exist
```

These errors occur because the test script tries to:
1. Insert data with `ordered_date`, `medication_type`, and `status` columns
2. Select data including these missing columns
3. All of these columns exist in the migration file but not in the actual database

## Next Steps

1. Apply the migration `20250614230000_create_visit_medical_junction_tables.sql` to your Supabase database
2. Re-run the test: `node test_medical_data_storage.js` 
3. The test should pass once all columns exist

## Verification

After applying the migration, you can verify success by running:
```bash
node check_columns.js
```

All columns should show as ✅ existing.