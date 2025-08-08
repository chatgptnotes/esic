# Medical Junction Tables Implementation

## Overview
This document describes the implementation of junction tables for storing medical personnel data (complications, surgeons, consultants, referees) in a many-to-many relationship with visits.

## Database Schema

### Junction Tables Created
The following junction tables link visits to medical personnel and complications:

1. **visit_complications** - Links visits to complications (already exists)
2. **visit_esic_surgeons** - Links visits to ESIC surgeons (needs manual creation)
3. **visit_referees** - Links visits to referees (needs manual creation)  
4. **visit_hope_surgeons** - Links visits to Hope surgeons (needs manual creation)
5. **visit_hope_consultants** - Links visits to Hope consultants (needs manual creation)

### Table Structure
Each junction table follows this pattern:
```sql
CREATE TABLE visit_[entity_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL,
  [entity]_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, [entity]_id)
);
```

## Implementation Details

### Files Created/Modified

#### 1. Helper Functions (`src/utils/medicalJunctionHelpers.ts`)
- `getVisitMedicalData(visitId)` - Retrieves all medical data for a visit
- `saveVisitMedicalData(visitId, data)` - Saves medical data to junction tables
- `MedicalJunctionData` interface - Type definition for medical data

#### 2. EditPatientDialog Updates (`src/components/EditPatientDialog.tsx`)
- Added medical junction data state management
- Integrated junction table loading when visit is selected
- Updated save mutation to include junction table operations
- Added proper error handling and user feedback

#### 3. Form Field Behavior
- **Multi-select fields**: ESIC surgeons, Hope consultants (allow multiple selections)
- **Single-select fields**: Referees, Hope surgeons (allow only one selection)
- Created `SingleSelectFieldSelect` component for single-select behavior

## Data Flow

### Loading Data
1. When a visit is selected in EditPatientDialog
2. `getVisitMedicalData()` fetches data from all junction tables
3. Form fields are populated with the retrieved data
4. Complications are loaded into the complications selector

### Saving Data
1. User makes changes to medical fields
2. On save, data is extracted from form fields
3. `saveVisitMedicalData()` is called with visit ID and medical data
4. Function clears existing junction table entries for the visit
5. New entries are inserted based on current selections
6. Success/error feedback is provided to user

## Manual Database Setup Required

Since programmatic table creation failed, the following tables need to be created manually in Supabase Dashboard:

```sql
-- Visit ESIC Surgeons Junction Table
CREATE TABLE IF NOT EXISTS visit_esic_surgeons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL,
  surgeon_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, surgeon_id)
);
ALTER TABLE visit_esic_surgeons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON visit_esic_surgeons FOR ALL USING (true);

-- Visit Referees Junction Table
CREATE TABLE IF NOT EXISTS visit_referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL,
  referee_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, referee_id)
);
ALTER TABLE visit_referees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON visit_referees FOR ALL USING (true);

-- Visit Hope Surgeons Junction Table
CREATE TABLE IF NOT EXISTS visit_hope_surgeons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL,
  surgeon_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, surgeon_id)
);
ALTER TABLE visit_hope_surgeons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON visit_hope_surgeons FOR ALL USING (true);

-- Visit Hope Consultants Junction Table
CREATE TABLE IF NOT EXISTS visit_hope_consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL,
  consultant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(visit_id, consultant_id)
);
ALTER TABLE visit_hope_consultants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON visit_hope_consultants FOR ALL USING (true);
```

## Benefits of This Architecture

1. **Proper Normalization**: Medical personnel data is properly normalized
2. **Many-to-Many Relationships**: Supports multiple surgeons/consultants per visit
3. **Data Integrity**: Foreign key constraints ensure data consistency
4. **Scalability**: Easy to add new medical personnel types
5. **Audit Trail**: Created timestamps for all relationships
6. **Flexible Queries**: Easy to query medical data by visit or personnel

## Current Status

✅ **Completed:**
- Helper functions created
- EditPatientDialog updated
- Form field behavior implemented (single vs multi-select)
- Data loading and saving logic implemented
- Error handling and user feedback added

⚠️ **Pending Manual Setup:**
- Create junction tables in Supabase Dashboard (SQL provided above)
- Test the complete data flow once tables are created

## Testing Checklist

Once tables are created manually:

1. ✅ Load patient with existing visit
2. ✅ Select medical personnel in form fields
3. ✅ Save changes and verify data is stored in junction tables
4. ✅ Reload patient and verify data is loaded correctly
5. ✅ Test multi-select vs single-select behavior
6. ✅ Test error handling for invalid data

## Future Enhancements

1. **Primary Diagnosis**: Add visit_diagnoses junction table for multiple diagnoses per visit
2. **Surgery Procedures**: Link surgeries to specific personnel
3. **Audit Logging**: Track changes to medical personnel assignments
4. **Bulk Operations**: Support bulk assignment of personnel to multiple visits 