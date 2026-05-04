
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1) DROP unused backup tables (PII exposure)
DROP TABLE IF EXISTS public.backup_guardians CASCADE;
DROP TABLE IF EXISTS public.backup_guardians_20260417 CASCADE;
DROP TABLE IF EXISTS public.backup_students CASCADE;
DROP TABLE IF EXISTS public.backup_students_20260417 CASCADE;
DROP TABLE IF EXISTS public.backup_student_guardians CASCADE;
DROP TABLE IF EXISTS public.backup_student_guardians_20260417 CASCADE;
DROP TABLE IF EXISTS public.backup_teacher_assignments_20260417 CASCADE;
DROP TABLE IF EXISTS public.backup_teacher_classes_20260417 CASCADE;

-- 2) user_invites: Enable RLS, restrict to superadmin
ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_invites_admin_all" ON public.user_invites;
CREATE POLICY "user_invites_admin_all" ON public.user_invites
  FOR ALL TO authenticated
  USING (public.is_superadmin() OR school_id = public.current_school_id())
  WITH CHECK (public.is_superadmin() OR school_id = public.current_school_id());

-- 3) student_reports: Enable RLS
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_reports_school" ON public.student_reports;
CREATE POLICY "student_reports_school" ON public.student_reports
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- 4) academic_results
ALTER TABLE public.academic_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "academic_results_school" ON public.academic_results;
CREATE POLICY "academic_results_school" ON public.academic_results
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- 5) documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_school" ON public.documents;
CREATE POLICY "documents_school" ON public.documents
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- 6) attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendance_school" ON public.attendance;
CREATE POLICY "attendance_school" ON public.attendance
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- 7) student_certificates
ALTER TABLE public.student_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_certificates_school" ON public.student_certificates;
CREATE POLICY "student_certificates_school" ON public.student_certificates
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- 8) assessments
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assessments_school" ON public.assessments;
CREATE POLICY "assessments_school" ON public.assessments
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- 9) student_dependencies (no school_id; join via students)
ALTER TABLE public.student_dependencies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "student_dependencies_school" ON public.student_dependencies;
CREATE POLICY "student_dependencies_school" ON public.student_dependencies
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.school_id = public.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.school_id = public.current_school_id()));

-- 10) recovery_grades (join via student_enrollments)
ALTER TABLE public.recovery_grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recovery_grades_school" ON public.recovery_grades;
CREATE POLICY "recovery_grades_school" ON public.recovery_grades
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_enrollments e WHERE e.id = enrollment_id AND e.school_id = public.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.student_enrollments e WHERE e.id = enrollment_id AND e.school_id = public.current_school_id()));

-- 11) teacher_classes
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teacher_classes_school" ON public.teacher_classes;
CREATE POLICY "teacher_classes_school" ON public.teacher_classes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.school_id = public.current_school_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.school_id = public.current_school_id()));

-- 12) Remove overly permissive policies
DROP POLICY IF EXISTS "select_enrollments" ON public.student_enrollments;
DROP POLICY IF EXISTS "select_students" ON public.students;
DROP POLICY IF EXISTS "Students SELECT" ON public.students;
DROP POLICY IF EXISTS "liberar select classes" ON public.classes;
DROP POLICY IF EXISTS "Allow select classes" ON public.classes;
DROP POLICY IF EXISTS "Allow update classes" ON public.classes;
DROP POLICY IF EXISTS "Allow insert classes" ON public.classes;
DROP POLICY IF EXISTS "teachers all" ON public.teachers;
DROP POLICY IF EXISTS "subjects all" ON public.subjects;

-- Re-add school-scoped policies for student_enrollments
DROP POLICY IF EXISTS "student_enrollments_school" ON public.student_enrollments;
CREATE POLICY "student_enrollments_school" ON public.student_enrollments
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- Subjects: school-scoped policies
DROP POLICY IF EXISTS "subjects_school" ON public.subjects;
CREATE POLICY "subjects_school" ON public.subjects
  FOR ALL TO authenticated
  USING (school_id = public.current_school_id())
  WITH CHECK (school_id = public.current_school_id());

-- 13) STORAGE: tighten public buckets to authenticated for INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "avatars insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars update" ON storage.objects;
CREATE POLICY "avatars insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "documents insert" ON storage.objects;
DROP POLICY IF EXISTS "documents update" ON storage.objects;
CREATE POLICY "documents insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');
CREATE POLICY "documents update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');
CREATE POLICY "documents delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "logos insert" ON storage.objects;
DROP POLICY IF EXISTS "logos update" ON storage.objects;
CREATE POLICY "logos insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');
CREATE POLICY "logos update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos')
  WITH CHECK (bucket_id = 'logos');
CREATE POLICY "logos delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos');

DROP POLICY IF EXISTS "school-assets insert" ON storage.objects;
DROP POLICY IF EXISTS "school-assets update" ON storage.objects;
CREATE POLICY "school-assets insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-assets');
CREATE POLICY "school-assets update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'school-assets')
  WITH CHECK (bucket_id = 'school-assets');
CREATE POLICY "school-assets delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'school-assets');
