-- 1) Atualiza o trigger para criar demanda também quando status muda para 'pendente' via UPDATE
CREATE OR REPLACE FUNCTION public.handle_student_document_flow()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
begin
  -- 🟡 INSERT pendente → cria demanda
  if (tg_op = 'INSERT') then
    if new.status = 'pendente' then
      if not exists (
        select 1 from secretaria_requests
        where student_document_id = new.id and status <> 'concluido'
      ) then
        insert into secretaria_requests (
          school_id, student_id, student_document_id,
          title, type, status, priority, document_type
        )
        values (
          new.school_id, new.student_id, new.id,
          'Documento pendente: ' || new.document_type,
          'documento', 'aberto', 'alta', new.document_type
        );
      end if;
    end if;
  end if;

  -- 🟠 UPDATE: aprovado → pendente (re-abertura)
  if (tg_op = 'UPDATE') then
    if (old.status is distinct from new.status) and new.status = 'pendente' then
      if not exists (
        select 1 from secretaria_requests
        where student_document_id = new.id and status <> 'concluido'
      ) then
        insert into secretaria_requests (
          school_id, student_id, student_document_id,
          title, type, status, priority, document_type
        )
        values (
          new.school_id, new.student_id, new.id,
          'Documento pendente: ' || new.document_type,
          'documento', 'aberto', 'alta', new.document_type
        );
      end if;
    end if;

    -- 🔵 aprovado → fecha demanda
    if old.status = 'pendente' and new.status = 'aprovado' then
      update secretaria_requests
      set status = 'concluido'
      where student_document_id = new.id and status <> 'concluido';

      insert into secretaria_actions (
        school_id, request_id, student_id,
        action_type, from_status, to_status
      )
      select sr.school_id, sr.id, sr.student_id,
             'documento_aprovado', 'pendente', 'aprovado'
      from secretaria_requests sr
      where sr.student_document_id = new.id
      limit 1;
    end if;
  end if;

  return new;
end;
$function$;

-- 2) Garante que o trigger esteja ativo para INSERT e UPDATE
DROP TRIGGER IF EXISTS trg_handle_student_document_flow ON public.student_documents;
CREATE TRIGGER trg_handle_student_document_flow
AFTER INSERT OR UPDATE ON public.student_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_student_document_flow();

-- 3) Backfill: cria secretaria_requests para documentos atualmente pendentes sem demanda aberta
INSERT INTO public.secretaria_requests (
  school_id, student_id, student_document_id,
  title, type, status, priority, document_type
)
SELECT sd.school_id, sd.student_id, sd.id,
       'Documento pendente: ' || sd.document_type,
       'documento', 'aberto', 'alta', sd.document_type
FROM public.student_documents sd
WHERE sd.status = 'pendente'
  AND NOT EXISTS (
    SELECT 1 FROM public.secretaria_requests sr
    WHERE sr.student_document_id = sd.id AND sr.status <> 'concluido'
  );