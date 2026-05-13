DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'superadmin','owner','admin','administracao','secretaria',
    'coordenador','diretor','professor','psicologo','auxiliar'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.role_status AS ENUM ('pending','active','rejected','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
