-- Policies de acesso por escola para secretaria_requests
-- (RLS já está habilitado, mas não havia nenhuma policy, bloqueando todas as leituras)

CREATE POLICY "secretaria_requests select by school"
  ON public.secretaria_requests
  FOR SELECT
  TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "secretaria_requests insert by school"
  ON public.secretaria_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "secretaria_requests update by school"
  ON public.secretaria_requests
  FOR UPDATE
  TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "secretaria_requests delete by school"
  ON public.secretaria_requests
  FOR DELETE
  TO authenticated
  USING (school_id = current_school_id());