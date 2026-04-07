-- Drop recursive policies
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Membership select policy" ON public.school_memberships;

-- Simple non-recursive policy: user reads own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Simple policy: user reads own memberships  
CREATE POLICY "Users can read own memberships"
  ON public.school_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());