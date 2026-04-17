-- Sincroniza profiles.school_id com a escola ativa em school_memberships
-- para que as policies RLS baseadas em current_school_id() retornem os dados corretos.

UPDATE public.profiles p
SET school_id = sm.school_id
FROM public.school_memberships sm
WHERE sm.user_id = p.id
  AND sm.status = 'ativo'
  AND sm.school_id IS NOT NULL
  AND (p.school_id IS DISTINCT FROM sm.school_id);

-- Atualiza ensure_user_school para SEMPRE alinhar profiles.school_id com a membership ativa
CREATE OR REPLACE FUNCTION public.ensure_user_school()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  sid uuid;
begin
  select sm.school_id into sid
  from public.school_memberships sm
  where sm.user_id = auth.uid()
    and sm.status = 'ativo'
    and sm.school_id is not null
  order by sm.created_at asc
  limit 1;

  if sid is not null then
    update public.profiles
    set school_id = sid
    where id = auth.uid()
      and (school_id is distinct from sid);
  end if;
end;
$function$;