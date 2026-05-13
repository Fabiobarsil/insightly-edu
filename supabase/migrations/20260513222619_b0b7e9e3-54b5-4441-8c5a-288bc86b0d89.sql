CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  status public.role_status NOT NULL DEFAULT 'pending',
  requested_role public.app_role NULL,
  approved_by uuid NULL REFERENCES auth.users(id),
  approved_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_with_school
  ON public.user_roles(user_id, school_id, role) WHERE school_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_roles_unique_no_school
  ON public.user_roles(user_id, role) WHERE school_id IS NULL;
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_school_idx ON public.user_roles(school_id);
CREATE INDEX IF NOT EXISTS user_roles_status_idx ON public.user_roles(status);

DROP TRIGGER IF EXISTS trg_user_roles_updated ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Backfill (uses dynamic SQL so newly-added enum values are visible)
DO $$
BEGIN
  EXECUTE $sql$
    INSERT INTO public.user_roles (user_id, school_id, role, status, approved_at)
    SELECT p.id, NULL, 'superadmin'::public.app_role, 'active'::public.role_status, now()
    FROM public.profiles p WHERE p.is_superadmin = true
    ON CONFLICT DO NOTHING
  $sql$;

  EXECUTE $sql$
    INSERT INTO public.user_roles (user_id, school_id, role, status, approved_at)
    SELECT am.user_id, am.account_id,
      (CASE WHEN lower(am.role) = ANY (ARRAY['superadmin','owner','admin','administracao','secretaria','coordenador','diretor','professor','psicologo','auxiliar'])
            THEN lower(am.role)::public.app_role ELSE 'auxiliar'::public.app_role END),
      'active'::public.role_status, now()
    FROM public.account_members am
    WHERE am.user_id IS NOT NULL AND am.account_id IS NOT NULL
    ON CONFLICT DO NOTHING
  $sql$;

  EXECUTE $sql$
    INSERT INTO public.user_roles (user_id, school_id, role, status, approved_at)
    SELECT sm.user_id, sm.school_id,
      (CASE WHEN lower(sm.role::text) = ANY (ARRAY['superadmin','owner','admin','administracao','secretaria','coordenador','diretor','professor','psicologo','auxiliar'])
            THEN lower(sm.role::text)::public.app_role ELSE 'auxiliar'::public.app_role END),
      'active'::public.role_status, now()
    FROM public.school_memberships sm
    WHERE sm.status = 'ativo' AND sm.user_id IS NOT NULL AND sm.school_id IS NOT NULL
    ON CONFLICT DO NOTHING
  $sql$;

  EXECUTE $sql$
    INSERT INTO public.user_roles (user_id, school_id, role, status, approved_at)
    SELECT p.id, p.school_id, lower(p.role)::public.app_role, 'active'::public.role_status, now()
    FROM public.profiles p
    WHERE p.role IS NOT NULL
      AND lower(p.role) = ANY (ARRAY['superadmin','owner','admin','administracao','secretaria','coordenador','diretor','professor','psicologo','auxiliar'])
      AND p.school_id IS NOT NULL
    ON CONFLICT DO NOTHING
  $sql$;
END $$;

-- Funções
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin' AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _school_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND status = 'active'
      AND (school_id = _school_id OR (school_id IS NULL AND role = 'superadmin')));
$$;

CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.user_roles
  WHERE user_id = auth.uid() AND status = 'active' AND school_id IS NOT NULL
  ORDER BY (role = 'owner') DESC, (role = 'admin') DESC, created_at ASC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_account_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.current_school_id();
$$;

CREATE OR REPLACE FUNCTION public.get_effective_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = auth.uid() AND status = 'active'
  ORDER BY CASE role
    WHEN 'superadmin' THEN 1 WHEN 'owner' THEN 2 WHEN 'admin' THEN 3
    WHEN 'diretor' THEN 4 WHEN 'coordenador' THEN 5 WHEN 'administracao' THEN 6
    WHEN 'secretaria' THEN 7 WHEN 'professor' THEN 8 WHEN 'psicologo' THEN 9
    WHEN 'auxiliar' THEN 10 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_has_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND status = 'active');
$$;

DROP FUNCTION IF EXISTS public.get_user_access();
CREATE OR REPLACE FUNCTION public.get_my_access()
RETURNS TABLE(role text, school_id uuid, status text, is_superadmin boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH ranked AS (
    SELECT ur.role::text AS role, ur.school_id, ur.status::text AS status,
      (ur.role = 'superadmin') AS is_super,
      ROW_NUMBER() OVER (
        ORDER BY (ur.status = 'active') DESC,
          CASE ur.role
            WHEN 'superadmin' THEN 1 WHEN 'owner' THEN 2 WHEN 'admin' THEN 3
            WHEN 'diretor' THEN 4 WHEN 'coordenador' THEN 5 WHEN 'administracao' THEN 6
            WHEN 'secretaria' THEN 7 WHEN 'professor' THEN 8 WHEN 'psicologo' THEN 9
            WHEN 'auxiliar' THEN 10 END,
          ur.created_at ASC
      ) AS rn
    FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
  SELECT role, school_id, status, is_super FROM ranked WHERE rn = 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_access()
RETURNS TABLE(role text, department text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role, NULL::text FROM public.get_my_access() WHERE status = 'active';
$$;

-- RLS
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR public.is_superadmin(auth.uid())
  OR (school_id IS NOT NULL AND (
       public.has_role(auth.uid(), school_id, 'owner')
    OR public.has_role(auth.uid(), school_id, 'admin')))
);

DROP POLICY IF EXISTS user_roles_insert_self_pending ON public.user_roles;
CREATE POLICY user_roles_insert_self_pending ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND status = 'pending'
  AND role <> 'superadmin' AND role <> 'owner'
);

DROP POLICY IF EXISTS user_roles_insert_admin ON public.user_roles;
CREATE POLICY user_roles_insert_admin ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (school_id IS NOT NULL AND (
       public.has_role(auth.uid(), school_id, 'owner')
    OR public.has_role(auth.uid(), school_id, 'admin')))
);

DROP POLICY IF EXISTS user_roles_update_admin ON public.user_roles;
CREATE POLICY user_roles_update_admin ON public.user_roles FOR UPDATE TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (school_id IS NOT NULL AND (
       public.has_role(auth.uid(), school_id, 'owner')
    OR public.has_role(auth.uid(), school_id, 'admin')))
)
WITH CHECK (
  public.is_superadmin(auth.uid())
  OR (school_id IS NOT NULL AND (
       public.has_role(auth.uid(), school_id, 'owner')
    OR public.has_role(auth.uid(), school_id, 'admin')))
);

DROP POLICY IF EXISTS user_roles_delete_admin ON public.user_roles;
CREATE POLICY user_roles_delete_admin ON public.user_roles FOR DELETE TO authenticated
USING (
  public.is_superadmin(auth.uid())
  OR (school_id IS NOT NULL AND public.has_role(auth.uid(), school_id, 'owner'))
);
