-- ============================================================
-- Supabase Dashboard → SQL Editor → Run this entire script
-- Fixes: logged-in users can see ALL other members on home page
-- ============================================================

-- One-time: mark existing biodatas as complete
UPDATE profiles
SET is_profile_complete = true
WHERE coalesce(trim(full_name), '') <> ''
  AND (
    coalesce(trim(education), '') <> ''
    OR coalesce(trim(profession), '') <> ''
    OR coalesce(trim(father_name), '') <> ''
    OR coalesce(trim(birth_place), '') <> ''
  );

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove old policies (ignore errors if names differ)
DROP POLICY IF EXISTS "profiles_select_for_matching" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- ✅ Any logged-in user can READ all profiles (home page list)
CREATE POLICY "profiles_select_authenticated_read_all"
ON profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_insert_own"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Realtime: Dashboard → Database → Replication → enable profiles table
-- (so new biodatas appear automatically on landing page)
