-- Optional: Tips payable to employees (used when tip_refund_from = 'employee' to record deduction from employee tip payout).
-- Run in accounting schema (adjust schema name if different).
INSERT INTO accounting.accounts (account_number, account_name, account_type, sub_type, balance_type, description, is_system_account)
VALUES ('2210', 'Tips Payable', 'Liability', 'Current Liability', 'credit', 'Tips owed to employees (reduced when tip refund is deducted from employee)', FALSE)
ON CONFLICT (account_number) DO NOTHING;
