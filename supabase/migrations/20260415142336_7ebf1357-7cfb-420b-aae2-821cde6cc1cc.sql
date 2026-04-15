-- Remove the insecure policy with OR true
DROP POLICY IF EXISTS "students_by_school" ON public.students;
