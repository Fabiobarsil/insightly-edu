import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth, getDashboardPath } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleRoute from "@/components/auth/RoleRoute";

import Login from "./pages/auth/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

import SuperadminDashboard from "./pages/dashboards/SuperadminDashboard.tsx";
import SchoolsList from "./pages/schools/SchoolsList.tsx";
import AdminDashboard from "./pages/dashboards/AdminDashboard.tsx";
import SecretariaDashboard from "./pages/dashboards/SecretariaDashboard.tsx";
import ProfessorDashboard from "./pages/dashboards/ProfessorDashboard.tsx";

import StudentsList from "./pages/students/StudentsList.tsx";
import StudentsCreate from "./pages/students/StudentsCreate.tsx";
import StudentsEdit from "./pages/students/StudentsEdit.tsx";
import StudentsDetail from "./pages/students/StudentsDetail.tsx";

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

import SubjectsList from "./pages/subjects/SubjectsList.tsx";

import GradeEntry from "./pages/grades/GradeEntry.tsx";
import GradeHistory from "./pages/grades/GradeHistory.tsx";

import AttendanceRecord from "./pages/attendance/AttendanceRecord.tsx";
import AttendanceView from "./pages/attendance/AttendanceView.tsx";
import AttendanceReports from "./pages/attendance/AttendanceReports.tsx";

import Documents from "./pages/documents/Documents.tsx";
import OfficialDocuments from "./pages/documents/OfficialDocuments.tsx";

import Communication from "./pages/communication/Communication.tsx";
import Settings from "./pages/settings/Settings.tsx";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Superadmin routes */}
            <Route path="/superadmin/dashboard" element={<RoleRoute allowedRoles={["superadmin"]}><SuperadminDashboard /></RoleRoute>} />
            <Route path="/superadmin/escolas" element={<RoleRoute allowedRoles={["superadmin"]}><SchoolsList /></RoleRoute>} />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} />
            <Route path="/admin/alunos" element={<RoleRoute allowedRoles={["admin"]}><StudentsList /></RoleRoute>} />
            <Route path="/admin/alunos/novo" element={<RoleRoute allowedRoles={["admin"]}><StudentsCreate /></RoleRoute>} />
            <Route path="/admin/alunos/:id" element={<RoleRoute allowedRoles={["admin"]}><StudentsDetail /></RoleRoute>} />
            <Route path="/admin/alunos/:id/editar" element={<RoleRoute allowedRoles={["admin"]}><StudentsEdit /></RoleRoute>} />
            <Route path="/admin/responsaveis" element={<RoleRoute allowedRoles={["admin"]}><GuardiansList /></RoleRoute>} />
            <Route path="/admin/responsaveis/novo" element={<RoleRoute allowedRoles={["admin"]}><GuardiansCreate /></RoleRoute>} />
            <Route path="/admin/responsaveis/:id" element={<RoleRoute allowedRoles={["admin"]}><GuardiansDetail /></RoleRoute>} />
            <Route path="/admin/responsaveis/:id/editar" element={<RoleRoute allowedRoles={["admin"]}><GuardiansEdit /></RoleRoute>} />
            <Route path="/admin/turmas" element={<RoleRoute allowedRoles={["admin"]}><ClassesList /></RoleRoute>} />
            <Route path="/admin/turmas/novo" element={<RoleRoute allowedRoles={["admin"]}><ClassesCreate /></RoleRoute>} />
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
            <Route path="/admin/configuracoes" element={<RoleRoute allowedRoles={["admin"]}><Settings /></RoleRoute>} />

            {/* Secretaria routes */}
            <Route path="/secretaria/dashboard" element={<RoleRoute allowedRoles={["secretaria"]}><SecretariaDashboard /></RoleRoute>} />
            <Route path="/secretaria/alunos" element={<RoleRoute allowedRoles={["secretaria"]}><StudentsList /></RoleRoute>} />
            <Route path="/secretaria/responsaveis" element={<RoleRoute allowedRoles={["secretaria"]}><GuardiansList /></RoleRoute>} />
            <Route path="/secretaria/turmas" element={<RoleRoute allowedRoles={["secretaria"]}><ClassesList /></RoleRoute>} />
            <Route path="/secretaria/professores" element={<RoleRoute allowedRoles={["secretaria"]}><TeachersList /></RoleRoute>} />
            <Route path="/secretaria/documentos" element={<RoleRoute allowedRoles={["secretaria"]}><Documents /></RoleRoute>} />

            {/* Professor routes */}
            <Route path="/professor/dashboard" element={<RoleRoute allowedRoles={["professor"]}><ProfessorDashboard /></RoleRoute>} />
            <Route path="/professor/turmas" element={<RoleRoute allowedRoles={["professor"]}><ClassesList /></RoleRoute>} />
            <Route path="/professor/disciplinas" element={<RoleRoute allowedRoles={["professor"]}><SubjectsList /></RoleRoute>} />
            <Route path="/professor/notas" element={<RoleRoute allowedRoles={["professor"]}><GradeEntry /></RoleRoute>} />
            <Route path="/professor/frequencia" element={<RoleRoute allowedRoles={["professor"]}><AttendanceRecord /></RoleRoute>} />

            {/* Legacy routes */}
            <Route path="/alunos" element={<ProtectedRoute><StudentsList /></ProtectedRoute>} />
            <Route path="/alunos/novo" element={<ProtectedRoute><StudentsCreate /></ProtectedRoute>} />
            <Route path="/alunos/:id" element={<ProtectedRoute><StudentsDetail /></ProtectedRoute>} />
            <Route path="/alunos/:id/editar" element={<ProtectedRoute><StudentsEdit /></ProtectedRoute>} />
            <Route path="/responsaveis" element={<ProtectedRoute><GuardiansList /></ProtectedRoute>} />
            <Route path="/responsaveis/novo" element={<ProtectedRoute><GuardiansCreate /></ProtectedRoute>} />
            <Route path="/responsaveis/:id" element={<ProtectedRoute><GuardiansDetail /></ProtectedRoute>} />
            <Route path="/responsaveis/:id/editar" element={<ProtectedRoute><GuardiansEdit /></ProtectedRoute>} />
            <Route path="/professores" element={<ProtectedRoute><TeachersList /></ProtectedRoute>} />
            <Route path="/professores/novo" element={<ProtectedRoute><TeachersCreate /></ProtectedRoute>} />
            <Route path="/professores/:id" element={<ProtectedRoute><TeachersDetail /></ProtectedRoute>} />
            <Route path="/professores/:id/editar" element={<ProtectedRoute><TeachersEdit /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
