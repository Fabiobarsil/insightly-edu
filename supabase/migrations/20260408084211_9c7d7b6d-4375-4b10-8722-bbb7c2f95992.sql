ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teacher_assignments_select"
  ON public.teacher_assignments FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "teacher_assignments_insert"
  ON public.teacher_assignments FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "teacher_assignments_delete"
  ON public.teacher_assignments FOR DELETE TO authenticated
  USING (school_id = current_school_id());