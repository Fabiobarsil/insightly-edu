
-- school_grades RLS
ALTER TABLE public.school_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_grades select by school" ON public.school_grades
FOR SELECT TO authenticated USING (school_id = current_school_id());

CREATE POLICY "school_grades insert by school" ON public.school_grades
FOR INSERT TO authenticated WITH CHECK (school_id = current_school_id());

CREATE POLICY "school_grades update by school" ON public.school_grades
FOR UPDATE TO authenticated USING (school_id = current_school_id()) WITH CHECK (school_id = current_school_id());

CREATE POLICY "school_grades delete by school" ON public.school_grades
FOR DELETE TO authenticated USING (school_id = current_school_id());

-- school_shifts RLS
ALTER TABLE public.school_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_shifts select by school" ON public.school_shifts
FOR SELECT TO authenticated USING (school_id = current_school_id());

CREATE POLICY "school_shifts insert by school" ON public.school_shifts
FOR INSERT TO authenticated WITH CHECK (school_id = current_school_id());

CREATE POLICY "school_shifts update by school" ON public.school_shifts
FOR UPDATE TO authenticated USING (school_id = current_school_id());

CREATE POLICY "school_shifts delete by school" ON public.school_shifts
FOR DELETE TO authenticated USING (school_id = current_school_id());
