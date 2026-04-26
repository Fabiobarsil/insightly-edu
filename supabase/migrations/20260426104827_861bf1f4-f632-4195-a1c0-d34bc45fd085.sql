-- 1) Tabela de agenda da Secretaria (1 registro por evento), isolada por escola
CREATE TABLE IF NOT EXISTS public.secretary_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  event_date date NOT NULL DEFAULT CURRENT_DATE,
  event_time time NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'outro' CHECK (type IN ('aula','reuniao','outro')),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_secretary_agenda_school_date
  ON public.secretary_agenda (school_id, event_date, event_time);

ALTER TABLE public.secretary_agenda ENABLE ROW LEVEL SECURITY;

-- Policies: por escola
CREATE POLICY "agenda select by school"
  ON public.secretary_agenda FOR SELECT TO authenticated
  USING (school_id = current_school_id());

CREATE POLICY "agenda insert by school"
  ON public.secretary_agenda FOR INSERT TO authenticated
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "agenda update by school"
  ON public.secretary_agenda FOR UPDATE TO authenticated
  USING (school_id = current_school_id())
  WITH CHECK (school_id = current_school_id());

CREATE POLICY "agenda delete by school"
  ON public.secretary_agenda FOR DELETE TO authenticated
  USING (school_id = current_school_id());

-- updated_at automático
DROP TRIGGER IF EXISTS trg_secretary_agenda_updated ON public.secretary_agenda;
CREATE TRIGGER trg_secretary_agenda_updated
BEFORE UPDATE ON public.secretary_agenda
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Hardening: fixar search_path em funções internas usadas pelas RLS/triggers
ALTER FUNCTION public.current_school_id() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_timestamp() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.set_school_id() SET search_path = public;
ALTER FUNCTION public.current_account_id() SET search_path = public;
ALTER FUNCTION public.get_effective_role() SET search_path = public;
ALTER FUNCTION public.user_has_access() SET search_path = public;
ALTER FUNCTION public.calculate_final_status(integer) SET search_path = public;