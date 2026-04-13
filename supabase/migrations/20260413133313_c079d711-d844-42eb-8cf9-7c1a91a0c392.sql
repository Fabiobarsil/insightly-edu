
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'whatsapp',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates select by school" ON public.message_templates FOR SELECT TO authenticated USING (school_id = current_school_id());
CREATE POLICY "templates insert by school" ON public.message_templates FOR INSERT TO authenticated WITH CHECK (school_id = current_school_id());
CREATE POLICY "templates update by school" ON public.message_templates FOR UPDATE TO authenticated USING (school_id = current_school_id()) WITH CHECK (school_id = current_school_id());
CREATE POLICY "templates delete by school" ON public.message_templates FOR DELETE TO authenticated USING (school_id = current_school_id());
