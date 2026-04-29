CREATE OR REPLACE VIEW public.v_student_avg
WITH (security_invoker = on) AS
SELECT
  g.student_id,
  s.full_name,
  se.class_id,
  g.school_id,
  AVG(g.grade_value) AS avg_grade
FROM public.grades g
JOIN public.students s
  ON s.id = g.student_id
 AND s.school_id = g.school_id
JOIN public.student_enrollments se
  ON se.id = g.enrollment_id
 AND se.school_id = g.school_id
GROUP BY g.student_id, s.full_name, se.class_id, g.school_id;

CREATE OR REPLACE VIEW public.v_class_avg
WITH (security_invoker = on) AS
SELECT
  se.class_id,
  g.school_id,
  AVG(g.grade_value) AS avg_grade
FROM public.grades g
JOIN public.student_enrollments se
  ON se.id = g.enrollment_id
 AND se.school_id = g.school_id
GROUP BY se.class_id, g.school_id;

CREATE OR REPLACE VIEW public.v_subject_avg
WITH (security_invoker = on) AS
SELECT
  se.class_id,
  g.assignment_id,
  g.school_id,
  AVG(g.grade_value) AS avg_grade
FROM public.grades g
JOIN public.student_enrollments se
  ON se.id = g.enrollment_id
 AND se.school_id = g.school_id
GROUP BY se.class_id, g.assignment_id, g.school_id;

CREATE OR REPLACE VIEW public.v_top_students
WITH (security_invoker = on) AS
SELECT
  student_id,
  full_name,
  class_id,
  school_id,
  avg_grade
FROM public.v_student_avg
ORDER BY avg_grade DESC;

CREATE OR REPLACE VIEW public.v_students_at_risk
WITH (security_invoker = on) AS
SELECT
  student_id,
  full_name,
  class_id,
  school_id,
  avg_grade
FROM public.v_student_avg
WHERE avg_grade < 6;