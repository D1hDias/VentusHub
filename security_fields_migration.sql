-- Migration: Add security fields to b2bUserProfiles table
-- Apply this when database quota is restored

-- Add security fields to b2b_user_profiles table (correct table name)
ALTER TABLE "b2b_user_profiles" 
ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "last_password_change" timestamp;

-- Update existing records to require password change
UPDATE "b2b_user_profiles" 
SET "must_change_password" = true 
WHERE "must_change_password" IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_b2b_must_change_password" ON "b2b_user_profiles"("must_change_password");
CREATE INDEX IF NOT EXISTS "idx_b2b_last_password_change" ON "b2b_user_profiles"("last_password_change");

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'b2b_user_profiles' 
AND column_name IN ('must_change_password', 'last_password_change');