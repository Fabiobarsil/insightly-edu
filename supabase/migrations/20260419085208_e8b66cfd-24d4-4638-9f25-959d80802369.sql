CREATE OR REPLACE FUNCTION public.get_student_historico(student_uuid uuid)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  WITH aluno AS (
    SELECT
      s.id,
      s.full_name,
      s.birth_date,
      s.school_id,
      sc.name AS school_name,
      sc.address AS school_address,
      sc.cnpj AS school_cnpj,
      sc.mec_authorization_code AS school_authorization
    FROM students s
    JOIN schools sc ON sc.id = s.school_id
    WHERE s.id = student_uuid
  ),
  disciplinas AS (
    SELECT
      sub.name AS disciplina,
      e.academic_year,
      AVG(g.grade_value)::numeric(4,1) AS nota
    FROM grades g
    JOIN assignments a ON a.id = g.assignment_id
    JOIN subjects sub ON sub.id = a.subject_id
    JOIN student_enrollments e ON e.id = g.enrollment_id
    WHERE g.student_id = student_uuid
    GROUP BY sub.name, e.academic_year
  ),
  anos AS (
    SELECT DISTINCT academic_year FROM disciplinas
    UNION
    SELECT DISTINCT academic_year FROM student_enrollments WHERE student_id = student_uuid
  ),
  anos_ord AS (
    SELECT academic_year, ROW_NUMBER() OVER (ORDER BY academic_year) AS rn
    FROM anos
    WHERE academic_year IS NOT NULL
  ),
  disciplinas_pivot AS (
    SELECT
      d.disciplina,
      MAX(CASE WHEN ao.rn = 1 THEN d.nota END) AS year_1,
      MAX(CASE WHEN ao.rn = 2 THEN d.nota END) AS year_2,
      MAX(CASE WHEN ao.rn = 3 THEN d.nota END) AS year_3,
      MAX(CASE WHEN ao.rn = 4 THEN d.nota END) AS year_4
    FROM disciplinas d
    LEFT JOIN anos_ord ao ON ao.academic_year = d.academic_year
    GROUP BY d.disciplina
  ),
  frequencia AS (
    SELECT
      e.academic_year,
      (
        SUM(CASE WHEN a.status = 'presente' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(a.id), 0)
      )::numeric(5,2) AS frequencia
    FROM student_enrollments e
    LEFT JOIN attendance a ON a.student_id = e.student_id
    WHERE e.student_id = student_uuid
    GROUP BY e.academic_year
  ),
  resultado AS (
    SELECT academic_year, final_status
    FROM academic_results
    WHERE student_id = student_uuid
  ),
  resumo AS (
    SELECT
      e.academic_year,
      800 AS workload,
      f.frequencia,
      COALESCE(r.final_status, '—') AS final_status
    FROM (SELECT DISTINCT academic_year FROM student_enrollments WHERE student_id = student_uuid) e
    LEFT JOIN frequencia f ON f.academic_year = e.academic_year
    LEFT JOIN resultado r ON r.academic_year = e.academic_year
  ),
  historico_escolas AS (
    SELECT
      e.academic_year,
      COALESCE(sc.name, '') AS school,
      '' AS city,
      '' AS state
    FROM (SELECT DISTINCT academic_year, school_id FROM student_enrollments WHERE student_id = student_uuid) e
    LEFT JOIN schools sc ON sc.id = e.school_id
  ),
  criterio AS (
    SELECT content
    FROM message_templates
    WHERE category = 'criterio_avaliacao'
      AND school_id = (SELECT school_id FROM aluno)
    LIMIT 1
  )
  SELECT json_build_object(
    'student_name', (SELECT full_name FROM aluno),
    'birth_date', (SELECT birth_date FROM aluno),
    'school_name', (SELECT school_name FROM aluno),
    'school_address', (SELECT school_address FROM aluno),
    'school_cnpj', (SELECT school_cnpj FROM aluno),
    'school_authorization', (SELECT school_authorization FROM aluno),
    'years', (SELECT json_agg(academic_year ORDER BY academic_year) FROM anos_ord),
    'subjects', COALESCE((
      SELECT json_agg(json_build_object(
        'name', disciplina,
        'year_1', year_1,
        'year_2', year_2,
        'year_3', year_3,
        'year_4', year_4
      ) ORDER BY disciplina)
      FROM disciplinas_pivot
    ), '[]'::json),
    'summary', COALESCE((
      SELECT json_agg(json_build_object(
        'year', academic_year,
        'workload', workload,
        'frequency', frequencia,
        'result', final_status
      ) ORDER BY academic_year)
      FROM resumo
    ), '[]'::json),
    'school_history', COALESCE((
      SELECT json_agg(json_build_object(
        'year', academic_year,
        'school', school,
        'city', city,
        'state', state
      ) ORDER BY academic_year)
      FROM historico_escolas
    ), '[]'::json),
    'evaluation_criteria', COALESCE((SELECT content FROM criterio), ''),
    'observation', 'O aluno deverá prosseguir para o próximo ano letivo.'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_historico(uuid) TO authenticated, anon;