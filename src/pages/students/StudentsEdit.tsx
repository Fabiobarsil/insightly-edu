const { isLoading } = useQuery({
  queryKey: ["student-enrollment", id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("student_enrollments")
      .select(
        `
        *,
        students (*),
        classes (id, name)
      `,
      )
      .eq("id", id!)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      setForm({
        ...data.students,
        class_id: data.class_id,
        academic_year: data.academic_year,
        enrollment_id: data.id,
      });

      if (data.students?.photo_url) {
        setPhotoPreview(data.students.photo_url);
      }
    }

    return data;
  },
  enabled: !!id,
});
