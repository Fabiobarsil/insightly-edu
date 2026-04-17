
-- 1. Backfill: preencher school_id em student_guardians com base no aluno
update public.student_guardians sg
set school_id = s.school_id
from public.students s
where sg.student_id = s.id
  and sg.school_id is null;

-- 2. Trigger para garantir school_id em novos vínculos
create or replace function public.set_student_guardian_school_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.school_id is null then
    select s.school_id into new.school_id
    from public.students s
    where s.id = new.student_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_student_guardian_school on public.student_guardians;
create trigger trg_set_student_guardian_school
  before insert on public.student_guardians
  for each row execute procedure public.set_student_guardian_school_id();
