CREATE POLICY "Teachers delete by school"
  ON public.teachers FOR DELETE TO authenticated
  USING (school_id = current_school_id());