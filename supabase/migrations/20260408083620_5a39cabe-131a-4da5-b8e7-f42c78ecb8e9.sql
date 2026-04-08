ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers select by school"
  ON public.teachers FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "Teachers insert by school"
  ON public.teachers FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "Teachers update by school"
  ON public.teachers FOR UPDATE TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());