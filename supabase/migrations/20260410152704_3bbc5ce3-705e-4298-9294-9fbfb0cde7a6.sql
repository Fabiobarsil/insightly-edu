
-- Create missing buckets (idempotent)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('school-assets', 'school-assets', true) ON CONFLICT (id) DO NOTHING;

-- student-assets policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'student-assets select' AND tablename = 'objects') THEN
    CREATE POLICY "student-assets select" ON storage.objects FOR SELECT USING (bucket_id = 'student-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'student-assets insert' AND tablename = 'objects') THEN
    CREATE POLICY "student-assets insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'student-assets update' AND tablename = 'objects') THEN
    CREATE POLICY "student-assets update" ON storage.objects FOR UPDATE USING (bucket_id = 'student-assets') WITH CHECK (bucket_id = 'student-assets');
  END IF;
END $$;

-- school-assets policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'school-assets select' AND tablename = 'objects') THEN
    CREATE POLICY "school-assets select" ON storage.objects FOR SELECT USING (bucket_id = 'school-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'school-assets insert' AND tablename = 'objects') THEN
    CREATE POLICY "school-assets insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'school-assets');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'school-assets update' AND tablename = 'objects') THEN
    CREATE POLICY "school-assets update" ON storage.objects FOR UPDATE USING (bucket_id = 'school-assets') WITH CHECK (bucket_id = 'school-assets');
  END IF;
END $$;

-- documents policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents select' AND tablename = 'objects') THEN
    CREATE POLICY "documents select" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents insert' AND tablename = 'objects') THEN
    CREATE POLICY "documents insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'documents update' AND tablename = 'objects') THEN
    CREATE POLICY "documents update" ON storage.objects FOR UPDATE USING (bucket_id = 'documents') WITH CHECK (bucket_id = 'documents');
  END IF;
END $$;

-- Schools UPDATE policy
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Schools update by school' AND tablename = 'schools') THEN
    CREATE POLICY "Schools update by school" ON public.schools FOR UPDATE TO authenticated USING (id = current_school_id()) WITH CHECK (id = current_school_id());
  END IF;
END $$;
