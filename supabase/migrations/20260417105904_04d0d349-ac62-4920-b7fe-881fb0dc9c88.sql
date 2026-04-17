-- 1. Função que cria profile automaticamente para novos usuários
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Trigger no auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill: cria profiles para usuários existentes que ainda não têm
insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- 4. Backfill: atribui school_id (a partir de school_memberships ativos) para profiles sem school_id
update public.profiles p
set school_id = sm.school_id
from public.school_memberships sm
where sm.user_id = p.id
  and sm.status = 'ativo'
  and p.school_id is null
  and sm.school_id is not null;

-- 5. Fallback: para profiles que ainda não têm school_id, usar a primeira escola disponível
update public.profiles p
set school_id = (
  select s.id from public.schools s order by s.created_at asc limit 1
)
where p.school_id is null
  and exists (select 1 from public.schools);

-- 6. Função para garantir school_id do usuário autenticado em runtime
create or replace function public.ensure_user_school()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  select school_id into sid
  from public.profiles
  where id = auth.uid();

  if sid is null then
    update public.profiles
    set school_id = coalesce(
      (select sm.school_id
         from public.school_memberships sm
         where sm.user_id = auth.uid() and sm.status = 'ativo' and sm.school_id is not null
         limit 1),
      (select c.school_id from public.classes c where c.school_id is not null limit 1),
      (select s.id from public.schools s order by s.created_at asc limit 1)
    )
    where id = auth.uid();
  end if;
end;
$$;

-- 7. Permitir que o usuário insira/atualize o próprio profile (necessário p/ ensure_user_school via cliente e p/ self-service)
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());