import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getDashboardPath } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";

import Login from "./pages/auth/Login.tsx";
import NoAccess from "./pages/auth/NoAccess.tsx";
import NotFound from "./pages/NotFound.tsx";

import SuperadminDashboard from "./pages/dashboards/SuperadminDashboard.tsx";
import SchoolsList from "./pages/schools/SchoolsList.tsx";
import AdminDashboard from "./pages/dashboards/AdminDashboard.tsx";
import CoordinationDashboard from "./pages/dashboards/CoordinationDashboard.tsx";
import DirecaoEscolar from "./pages/dashboards/DirecaoEscolar.tsx";
import SecretariaDashboard from "./pages/dashboards/SecretariaDashboard.tsx";
import ProfessorDashboard from "./pages/dashboards/ProfessorDashboard.tsx";
import PsicologiaDashboard from "./pages/dashboards/PsicologiaDashboard.tsx";

import StudentsList from "./pages/students/StudentsList.tsx";
import StudentsCreate from "./pages/students/StudentsCreate.tsx";
import StudentsEdit from "./pages/students/StudentsEdit.tsx";
import StudentsDetail from "./pages/students/StudentsDetail.tsx";
import StudentRecord from "./pages/students/StudentRecord.tsx";
import StudentsDocuments from "./pages/students/StudentsDocuments.tsx";

import GuardiansList from "./pages/guardians/GuardiansList.tsx";
import GuardiansCreate from "./pages/guardians/GuardiansCreate.tsx";
import GuardiansEdit from "./pages/guardians/GuardiansEdit.tsx";
import GuardiansDetail from "./pages/guardians/GuardiansDetail.tsx";

import TeachersList from "./pages/teachers/TeachersList.tsx";
import TeachersCreate from "./pages/teachers/TeachersCreate.tsx";
import TeachersDetail from "./pages/teachers/TeachersDetail.tsx";
import TeachersEdit from "./pages/teachers/TeachersEdit.tsx";

import ClassesList from "./pages/classes/ClassesList.tsx";
import ClassesCreate from "./pages/classes/ClassesCreate.tsx";
import ClassesEdit from "./pages/classes/ClassesEdit.tsx";

import SubjectsList from "./pages/subjects/SubjectsList.tsx";

import GradeEntry from "./pages/grades/GradeEntry.tsx";
import GradeHistory from "./pages/grades/GradeHistory.tsx";

import AttendanceRecord from "./pages/attendance/AttendanceRecord.tsx";
import AttendanceView from "./pages/attendance/AttendanceView.tsx";
import AttendanceReports from "./pages/attendance/AttendanceReports.tsx";

import Documents from "./pages/documents/Documents.tsx";


import Communication from "./pages/communication/Communication.tsx";
import Settings from "./pages/settings/Settings.tsx";
import CertificadoPage from "./pages/certificates/CertificadoPage.tsx";
import CertificadoPreview from "./pages/admin/CertificadoPreview.tsx";
import Indicadores from "./pages/admin/Indicadores.tsx";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const { session, loading, dashboardRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (dashboardRole) return <Navigate to={getDashboardPath(dashboardRole)} replace />;
  return <Navigate to="/login" replace />;
};

/** Redirects legacy paths to the user's role-prefixed equivalent */
const LegacyRedirect = ({ path }: { path: string }) => {
  const { dashboardRole, loading, session } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  const prefix = dashboardRole === "superadmin" ? "/superadmin"
    : dashboardRole === "admin" ? "/admin"
    : dashboardRole === "secretaria" ? "/secretaria"
    : dashboardRole === "professor" ? "/professor"
    : dashboardRole === "psicologo" ? "/psicologia"
    : "";

  return <Navigate to={`${prefix}${path}`} replace />;
};

/** Redireciona edição de aluno para o fluxo centralizado da Secretaria */
const StudentEditRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/secretaria/matricula/${id}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/sem-acesso" element={<NoAccess />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Superadmin routes */}
            <Route path="/superadmin/dashboard" element={<RoleRoute allowedRoles={["superadmin"]}><SuperadminDashboard /></RoleRoute>} />
            <Route path="/superadmin/escolas" element={<RoleRoute allowedRoles={["superadmin"]}><SchoolsList /></RoleRoute>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} />
            <Route path="/admin/alunos" element={<RoleRoute allowedRoles={["admin"]}><StudentsList /></RoleRoute>} />
            <Route path="/admin/alunos/novo" element={<RoleRoute allowedRoles={["admin"]}><StudentsCreate /></RoleRoute>} />
            <Route path="/admin/alunos/:id" element={<RoleRoute allowedRoles={["admin"]}><StudentsDetail /></RoleRoute>} />
            {/* Edição centralizada na Secretaria — redireciona */}
            <Route path="/admin/alunos/:id/editar" element={<StudentEditRedirect />} />
            <Route path="/admin/alunos/:id/prontuario" element={<RoleRoute allowedRoles={["admin"]}><StudentRecord /></RoleRoute>} />
            <Route path="/admin/alunos/:id/entrega-documentos" element={<RoleRoute allowedRoles={["admin", "secretaria"]}><StudentsDocuments /></RoleRoute>} />
            <Route path="/secretaria/alunos/:id/entrega-documentos" element={<RoleRoute allowedRoles={["admin", "secretaria"]}><StudentsDocuments /></RoleRoute>} />
            <Route path="/admin/responsaveis" element={<RoleRoute allowedRoles={["admin"]}><GuardiansList /></RoleRoute>} />
            <Route path="/admin/responsaveis/novo" element={<RoleRoute allowedRoles={["admin"]}><GuardiansCreate /></RoleRoute>} />
            <Route path="/admin/responsaveis/:id" element={<RoleRoute allowedRoles={["admin"]}><GuardiansDetail /></RoleRoute>} />
            <Route path="/admin/responsaveis/:id/editar" element={<RoleRoute allowedRoles={["admin"]}><GuardiansEdit /></RoleRoute>} />
            <Route path="/admin/turmas" element={<RoleRoute allowedRoles={["admin"]}><ClassesList /></RoleRoute>} />
            <Route path="/admin/turmas/novo" element={<RoleRoute allowedRoles={["admin"]}><ClassesCreate /></RoleRoute>} />
            <Route path="/admin/turmas/:id/editar" element={<RoleRoute allowedRoles={["admin"]}><ClassesEdit /></RoleRoute>} />
            <Route path="/secretaria/turmas/:id/editar" element={<RoleRoute allowedRoles={["secretaria", "admin"]}><ClassesEdit /></RoleRoute>} />
            <Route path="/admin/professores" element={<RoleRoute allowedRoles={["admin"]}><TeachersList /></RoleRoute>} />
            <Route path="/admin/professores/novo" element={<RoleRoute allowedRoles={["admin"]}><TeachersCreate /></RoleRoute>} />
            <Route path="/admin/professores/:id" element={<RoleRoute allowedRoles={["admin"]}><TeachersDetail /></RoleRoute>} />
            <Route path="/admin/professores/:id/editar" element={<RoleRoute allowedRoles={["admin"]}><TeachersEdit /></RoleRoute>} />
            <Route path="/admin/disciplinas" element={<RoleRoute allowedRoles={["admin"]}><SubjectsList /></RoleRoute>} />
            <Route path="/admin/notas" element={<RoleRoute allowedRoles={["admin"]}><GradeEntry /></RoleRoute>} />
            <Route path="/admin/notas/historico" element={<RoleRoute allowedRoles={["admin"]}><GradeHistory /></RoleRoute>} />
            <Route path="/admin/frequencia" element={<RoleRoute allowedRoles={["admin"]}><AttendanceRecord /></RoleRoute>} />
            <Route path="/admin/documentos" element={<RoleRoute allowedRoles={["admin"]}><Documents /></RoleRoute>} />
            <Route path="/admin/comunicacao" element={<RoleRoute allowedRoles={["admin"]}><Communication /></RoleRoute>} />
            <Route path="/admin/coordenacao" element={<RoleRoute allowedRoles={["admin"]}><CoordinationDashboard /></RoleRoute>} />
            <Route path="/admin/direcao" element={<RoleRoute allowedRoles={["admin"]}><DirecaoEscolar /></RoleRoute>} />
            <Route path="/admin/configuracoes" element={<RoleRoute allowedRoles={["admin"]}><Settings /></RoleRoute>} />
            <Route path="/admin/certificado-preview" element={<RoleRoute allowedRoles={["admin"]}><CertificadoPreview /></RoleRoute>} />
            <Route path="/admin/indicadores" element={<RoleRoute allowedRoles={["admin"]}><Indicadores /></RoleRoute>} />

            {/* Secretaria routes */}
            <Route path="/secretaria/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/secretaria/alunos" element={<RoleRoute allowedRoles={["secretaria"]}><StudentsList /></RoleRoute>} />
            <Route path="/secretaria/matricula/:id" element={<RoleRoute allowedRoles={["admin", "secretaria"]}><StudentsCreate /></RoleRoute>} />
            <Route path="/secretaria/responsaveis" element={<RoleRoute allowedRoles={["secretaria"]}><GuardiansList /></RoleRoute>} />
            <Route path="/secretaria/turmas" element={<RoleRoute allowedRoles={["secretaria"]}><ClassesList /></RoleRoute>} />
            <Route path="/secretaria/professores" element={<RoleRoute allowedRoles={["secretaria"]}><TeachersList /></RoleRoute>} />
            <Route path="/secretaria/disciplinas" element={<RoleRoute allowedRoles={["secretaria"]}><SubjectsList /></RoleRoute>} />
            <Route path="/secretaria/documentos" element={<RoleRoute allowedRoles={["secretaria"]}><Documents /></RoleRoute>} />

            {/* Professor routes */}
            <Route path="/professor/dashboard" element={<RoleRoute allowedRoles={["professor"]}><ProfessorDashboard /></RoleRoute>} />
            <Route path="/professor/turmas" element={<RoleRoute allowedRoles={["professor"]}><ClassesList /></RoleRoute>} />
            <Route path="/professor/disciplinas" element={<RoleRoute allowedRoles={["professor"]}><SubjectsList /></RoleRoute>} />
            <Route path="/professor/notas" element={<RoleRoute allowedRoles={["professor"]}><GradeEntry /></RoleRoute>} />
            <Route path="/professor/frequencia" element={<RoleRoute allowedRoles={["professor"]}><AttendanceRecord /></RoleRoute>} />

            {/* Psicologia */}
            <Route path="/psicologia/dashboard" element={<RoleRoute allowedRoles={["psicologo"]}><PsicologiaDashboard /></RoleRoute>} />

            {/* Certificado */}
            <Route path="/certificado" element={<ProtectedRoute><CertificadoPage /></ProtectedRoute>} />

            {/* Legacy route redirects - redirect to role-prefixed paths */}
            <Route path="/alunos" element={<LegacyRedirect path="/alunos" />} />
            <Route path="/alunos/novo" element={<LegacyRedirect path="/alunos/novo" />} />
            <Route path="/alunos/:id" element={<LegacyRedirect path="/alunos" />} />
            <Route path="/alunos/:id/editar" element={<LegacyRedirect path="/alunos" />} />
            <Route path="/responsaveis" element={<LegacyRedirect path="/responsaveis" />} />
            <Route path="/responsaveis/*" element={<LegacyRedirect path="/responsaveis" />} />
            <Route path="/professores" element={<LegacyRedirect path="/professores" />} />
            <Route path="/professores/*" element={<LegacyRedirect path="/professores" />} />
            <Route path="/turmas" element={<LegacyRedirect path="/turmas" />} />
            <Route path="/turmas/*" element={<LegacyRedirect path="/turmas" />} />
            <Route path="/disciplinas" element={<LegacyRedirect path="/disciplinas" />} />
            <Route path="/notas" element={<LegacyRedirect path="/notas" />} />
            <Route path="/notas/*" element={<LegacyRedirect path="/notas" />} />
            <Route path="/frequencia" element={<LegacyRedirect path="/frequencia" />} />
            <Route path="/frequencia/*" element={<LegacyRedirect path="/frequencia" />} />
            <Route path="/documentos" element={<LegacyRedirect path="/documentos" />} />
            <Route path="/documentos/*" element={<LegacyRedirect path="/documentos" />} />
            <Route path="/comunicacao" element={<LegacyRedirect path="/comunicacao" />} />
            <Route path="/configuracoes" element={<LegacyRedirect path="/configuracoes" />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
