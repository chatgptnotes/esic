# Critical Database Schema Fixes - Implementation Instructions

## Overview
This document provides step-by-step instructions to fix critical database schema issues in the ESIC healthcare management system. These fixes address missing junction tables, foreign key mismatches, and missing columns that are blocking medical data functionality.

## ⚠️ IMPORTANT: Execute in Supabase SQL Editor
These SQL scripts must be run in your Supabase project's SQL Editor in the exact order specified below.

**Supabase Project**: `xvkxccqaopbnkvwgyfjv`
**Access**: Go to https://supabase.com/dashboard/project/xvkxccqaopbnkvwgyfjv/sql/new

## Execution Order (CRITICAL)

### Step 1: Create Missing Junction Tables
**File**: `URGENT_FIX_JUNCTION_TABLES.sql`
**Purpose**: Creates the missing junction tables required for medical data relationships

```sql
-- This script creates:
-- - visit_labs (links visits to lab orders/results)
-- - visit_radiology (links visits to radiology studies)  
-- - visit_medications (links visits to prescribed medications)
-- - visit_surgeries (links visits to surgical procedures)
```

**Verification**: After running, verify tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('visit_labs', 'visit_radiology', 'visit_medications', 'visit_surgeries');
```

### Step 2: Add Missing Columns
**File**: `URGENT_DATABASE_FIX.sql`
**Purpose**: Adds critical missing columns to junction tables

```sql
-- This script adds columns like:
-- - status, ordered_date, result_value, notes to visit_labs
-- - status, ordered_date, findings, impression to visit_radiology
-- - status, prescribed_date, dosage, frequency to visit_medications
```

**Verification**: Check columns were added:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'visit_labs' AND table_schema = 'public';
```

### Step 3: Fix Foreign Key Type Mismatches
**File**: `fix_junction_table_foreign_keys.sql`
**Purpose**: Fixes foreign key type mismatches (TEXT vs UUID)

```sql
-- This script fixes visit_id columns to be UUID type
-- to properly reference visits.id (UUID primary key)
```

**Verification**: Confirm foreign key types:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE column_name = 'visit_id' AND table_schema = 'public';
```

### Step 4: Add Additional Missing Columns
**File**: `ADD_MISSING_COLUMNS.sql`
**Purpose**: Adds any remaining missing columns and performance indexes

```sql
-- This script adds final missing columns and creates indexes
-- for better query performance
```

**Verification**: Check all tables have required columns and indexes.

## Post-Execution Testing

### 1. Verify Junction Tables Structure
Run this query to confirm all junction tables exist with proper structure:

```sql
-- Check junction tables exist
SELECT 
    t.table_name,
    COUNT(c.column_name) as column_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
AND t.table_name IN ('visit_labs', 'visit_radiology', 'visit_medications', 'visit_surgeries')
GROUP BY t.table_name
ORDER BY t.table_name;
```

### 2. Test Foreign Key Relationships
Verify foreign keys work correctly:

```sql
-- Test visit_labs foreign key
SELECT v.id as visit_id, vl.id as visit_lab_id 
FROM visits v 
LEFT JOIN visit_labs vl ON v.id = vl.visit_id 
LIMIT 5;
```

### 3. Application Testing
After database fixes, test these workflows in the application:

1. **Patient Registration**: Create a new patient
2. **Visit Creation**: Create a visit for the patient  
3. **Medical Data Entry**: Use the Investigations tab to:
   - Add lab orders
   - Add radiology studies
   - Add medications
4. **Data Retrieval**: Verify medical data appears correctly in patient records

## Troubleshooting

### If Step 1 Fails
- Check if tables already exist: `\dt visit_*`
- If they exist but are corrupted, you may need to drop them first
- Ensure you have proper permissions in Supabase

### If Step 3 Fails (Foreign Key Fix)
- This step may fail if there's existing data with invalid UUIDs
- Check for invalid visit_id values: `SELECT visit_id FROM visit_labs WHERE visit_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`
- Clean up invalid data before running the foreign key fix

### If Application Testing Fails
- Check browser console for errors
- Verify Supabase connection is working
- Ensure Row Level Security policies allow your operations
- Check that the application code is using the correct table names

## Success Criteria

✅ All four SQL scripts execute without errors
✅ Junction tables exist with proper columns
✅ Foreign keys reference correct UUID types  
✅ Medical data entry works through Investigations tab
✅ Patient medical data displays correctly in the application

## Next Steps After Database Fixes

Once database schema is fixed:
1. Regenerate TypeScript types from Supabase
2. Remove TypeScript override files
3. Test full medical workflow end-to-end
4. Address performance optimizations

---

**Created**: August 13, 2025
**Status**: Ready for execution
**Priority**: CRITICAL - Execute immediately
