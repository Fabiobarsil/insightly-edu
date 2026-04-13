
CREATE TABLE public.secretary_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  student_name TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  student_status TEXT NOT NULL DEFAULT 'ativo',
  request_type TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'aberto',
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.secretary_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secretary_requests select by school"
  ON public.secretary_requests FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "secretary_requests insert by school"
  ON public.secretary_requests FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "secretary_requests update by school"
  ON public.secretary_requests FOR UPDATE TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "secretary_requests delete by school"
  ON public.secretary_requests FOR DELETE TO authenticated
  USING (school_id = current_school_id());
