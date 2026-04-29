-- Backfill enrollment_code para alunos existentes usando a mesma lógica do trigger
DO $$
DECLARE
  r RECORD;
  v_serie TEXT;
  v_serie_num TEXT;
  v_ensino_sigla TEXT := 'M';
  v_ano INT;
  v_seq INT;
  v_seq_format TEXT;
  v_code TEXT;
BEGIN
  FOR r IN
    SELECT s.id, s.class_id, s.school_id
    FROM students s
    WHERE s.enrollment_code IS NULL
      AND s.class_id IS NOT NULL
    ORDER BY s.full_name
  LOOP
    SELECT name, academic_year INTO v_serie, v_ano
    FROM classes WHERE id = r.class_id;

    IF v_serie IS NULL OR v_ano IS NULL THEN
      CONTINUE;
    END IF;

    v_serie_num := regexp_replace(v_serie, '\D', '', 'g');
    IF v_serie_num = '' THEN v_serie_num := '0'; END IF;

    -- próxima sequência baseada nos códigos já existentes nesta turma/ano/escola
    SELECT COALESCE(MAX(RIGHT(enrollment_code, 3)::INTEGER), 0) + 1
    INTO v_seq
    FROM students
    WHERE class_id = r.class_id
      AND academic_year = v_ano
      AND school_id = r.school_id
      AND enrollment_code IS NOT NULL
      AND enrollment_code ~ '\d{3}$';

    v_seq_format := LPAD(v_seq::TEXT, 3, '0');
    v_code := v_serie_num || v_ensino_sigla || v_ano || v_seq_format;

    UPDATE students SET enrollment_code = v_code WHERE id = r.id;
  END LOOP;
END $$;