-- Políticas RLS para secretaria_actions (estavam ausentes, bloqueando inserts)
CREATE POLICY "secretaria_actions select by school"
ON public.secretaria_actions
FOR SELECT
TO authenticated
USING (school_id = current_school_id());

CREATE POLICY "secretaria_actions insert by school"
ON public.secretaria_actions
FOR INSERT
TO authenticated
WITH CHECK (school_id = current_school_id());