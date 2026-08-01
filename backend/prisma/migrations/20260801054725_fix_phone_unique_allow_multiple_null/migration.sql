-- SQL Server's plain UNIQUE CONSTRAINT only permits a single NULL row for the
-- whole table, unlike MySQL where every NULL is treated as distinct. Since
-- `phone` is optional (most users sign up by email/password, only OTP login
-- sets it), that made every second user without a phone number fail to be
-- created. Swap the constraint for a filtered unique index that only
-- enforces uniqueness among non-null phone numbers.
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_phone_key];

CREATE UNIQUE NONCLUSTERED INDEX [User_phone_key] ON [dbo].[User]([phone]) WHERE [phone] IS NOT NULL;
