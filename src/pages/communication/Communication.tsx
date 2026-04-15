import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import RoleLayout from "@/components/layout/RoleLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolId } from "@/hooks/useSchoolId";
import CommunicationForm from "@/components/communication/CommunicationForm";
import StudentSmartPanel from "@/components/communication/StudentSmartPanel";

const Communication = () => {
  const { schoolId } = useSchoolId();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ["comm-students", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name, status, class_id")
        .eq("school_id", schoolId)
        .order("full_name");
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  // Fetch primary guardian for selected student
  const { data: guardian } = useQuery({
    queryKey: ["comm-guardian", selectedStudentId, schoolId],
    queryFn: async () => {
      if (!selectedStudentId || !schoolId) return null;
      const { data: links } = await supabase
        .from("student_guardians")
        .select("guardian_id")
        .eq("student_id", selectedStudentId)
        .eq("school_id", schoolId);
      if (!links || links.length === 0) return null;
      const ids = links.map((l) => l.guardian_id);
      const { data: guardians } = await supabase
        .from("guardians")
        .select("id, full_name, phone, email, is_primary")
        .in("id", ids);
      if (!guardians || guardians.length === 0) return null;
      return guardians.find((g) => g.is_primary) ?? guardians[0];
    },
    enabled: !!selectedStudentId && !!schoolId,
  });

  return (
    <RoleLayout title="Comunicação">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — Form */}
        <div className="lg:col-span-3">
          <CommunicationForm
            students={students}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            guardian={guardian ?? null}
            mensagem={mensagem}
            setMensagem={setMensagem}
          />
        </div>

        {/* Right — Smart Panel */}
        <div className="lg:col-span-2">
          <StudentSmartPanel
            student={selectedStudent}
            schoolId={schoolId}
            onSuggest={setMensagem}
          />
        </div>
      </div>
    </RoleLayout>
  );
};

export default Communication;
