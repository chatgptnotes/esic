# CGHS Surgery Data Update Guide

This guide explains how to analyze and update CGHS surgery data from CSV files.

## Overview

The CGHS surgery table in Supabase contains procedure information including:
- Procedure codes and names
- Non-NABH/NABL rates
- NABH/NABL rates  
- Revised dates

## Scripts Available

### 1. `parse_complex_cghs_csv.js`
Parses complex CSV formats and converts them to standard CSV format.

**Usage:**
```bash
node parse_complex_cghs_csv.js <input-file>
```

**Supported formats:**
- Tab-separated values
- Pipe-separated values (|)
- Space-separated with mixed format
- Comma-separated values
- Complex formats like: "1 Consultation OPD 350 350 12.04.2023"

**Output:** Creates a standardized CSV file ready for analysis

### 2. `analyze_cghs_csv_data.js`
Analyzes CSV data and compares it with current database records.

**Usage:**
```bash
node analyze_cghs_csv_data.js <csv-file-path>
```

**Features:**
- Compares CSV data with current database records
- Identifies records needing updates
- Finds new records to add
- Generates detailed analysis report

**Output:** `cghs_analysis_report.json` with complete comparison results

### 3. `generate_cghs_update_script.js`
Generates update and verification scripts based on analysis report.

**Usage:**
```bash
node generate_cghs_update_script.js <report-file-path>
```

**Generates:**
1. `update_cghs_surgery_data.js` - Script to update database
2. `verify_cghs_updates.js` - Script to verify updates

### 4. Helper Scripts

- `check_cghs_current_data.js` - View current database state
- `test_cghs_comparison.js` - Test the comparison logic

## Step-by-Step Process

### Step 1: Prepare Your CSV Data

If your CSV has a complex format:
```bash
node parse_complex_cghs_csv.js your_data.txt
```

This creates `parsed_your_data.csv`

### Step 2: Analyze the Data

```bash
node analyze_cghs_csv_data.js parsed_your_data.csv
```

Review the output to see:
- How many records need updates
- What fields will change
- New records to be added

### Step 3: Generate Update Scripts

```bash
node generate_cghs_update_script.js cghs_analysis_report.json
```

### Step 4: Review and Execute Updates

1. Review the generated update script
2. Run with confirmation:
```bash
node update_cghs_surgery_data.js --confirm
```

### Step 5: Verify Updates

```bash
node verify_cghs_updates.js
```

## CSV Format Expected

The CSV should contain these columns:
- `Sr_No` or serial number (will be used as code)
- `Procedure_Name` 
- `Non_NABH_NABL_Rate` (numeric)
- `NABH_NABL_Rate` (numeric)
- `Revised_Date` (format: DD.MM.YYYY or DD/MM/YYYY)

## Example CSV Data

```
Sr_No,Procedure_Name,Non_NABH_NABL_Rate,NABH_NABL_Rate,Revised_Date
1,Consultation OPD,350,350,12.04.2023
2,Consultation- for Inpatients,350,350,12.04.2023
3,Dressings of wounds,255,300,01.02.2024
```

## Database Schema

The cghs_surgery table has these columns:
- `id` (UUID)
- `code` (text) - matches Sr_No from CSV
- `name` (text)
- `Procedure_Name` (text)
- `Non_NABH_NABL_Rate` (decimal)
- `NABH_NABL_Rate` (decimal)
- `Revised_Date` (date)
- `description` (text)
- `cost` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Safety Features

- All updates are logged
- Batch processing to avoid timeouts
- Verification script to check results
- No data is deleted, only updated or added
- Detailed error reporting

## Troubleshooting

1. **CSV parsing issues**: Use `parse_complex_cghs_csv.js` to handle non-standard formats
2. **Large datasets**: Scripts process in batches of 50 records
3. **Date format issues**: Supports DD.MM.YYYY, DD/MM/YYYY, and YYYY-MM-DD formats
4. **Matching issues**: Records are matched by code (Sr_No) first, then by procedure name

## Current Database Status

As of the last check:
- Total records: 1679
- Records with revised dates: 144
- Date range: 2023-04-12 to 2024-02-01