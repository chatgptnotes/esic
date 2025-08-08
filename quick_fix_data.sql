-- Quick Fix: Insert Missing Chart of Accounts Data
-- Run this in Supabase SQL Editor to fix the missing data issue

-- Check current data
SELECT 'Current data status:' as message;
SELECT COUNT(*) as chart_of_accounts_count FROM chart_of_accounts;
SELECT COUNT(*) as voucher_types_count FROM voucher_types;

-- Insert chart of accounts data (this will skip if data already exists)
INSERT INTO chart_of_accounts (account_code, account_name, account_type, account_group, opening_balance, opening_balance_type) VALUES
('1000', 'ASSETS', 'ASSETS', 'PRIMARY GROUP', 0.00, 'DR'),
('1110', 'Cash in Hand', 'CURRENT_ASSETS', 'CASH', 0.00, 'DR'),
('1120', 'Cash at Bank', 'CURRENT_ASSETS', 'BANK', 0.00, 'DR'),
('1400', 'Patient Debtors', 'CURRENT_ASSETS', 'DEBTORS', 0.00, 'DR'),
('2000', 'LIABILITIES', 'LIABILITIES', 'PRIMARY GROUP', 0.00, 'CR'),
('3000', 'CAPITAL ACCOUNT', 'EQUITY', 'PRIMARY GROUP', 0.00, 'CR'),
('4000', 'INCOME', 'INCOME', 'PRIMARY GROUP', 0.00, 'CR'),
('4110', 'Consultation Fees', 'DIRECT_INCOME', 'CONSULTATION', 0.00, 'CR'),
('5000', 'EXPENSES', 'EXPENSES', 'PRIMARY GROUP', 0.00, 'DR'),
('5210', 'Staff Salary', 'INDIRECT_EXPENSES', 'SALARY', 0.00, 'DR')
ON CONFLICT (account_code) DO NOTHING;

-- Verify the data was inserted
SELECT 'After insert:' as message;
SELECT COUNT(*) as chart_of_accounts_count FROM chart_of_accounts;
SELECT COUNT(*) as voucher_types_count FROM voucher_types;

SELECT 'Quick fix completed! Now click Refresh Status button on the accounting page.' as status;