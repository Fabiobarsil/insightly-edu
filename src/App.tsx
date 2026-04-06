import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import Login from "./pages/auth/Login.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

import StudentsList from "./pages/students/StudentsList.tsx";
import StudentsCreate from "./pages/students/StudentsCreate.tsx";
import StudentsEdit from "./pages/students/StudentsEdit.tsx";
import StudentsDetail from "./pages/students/StudentsDetail.tsx";

import GuardiansList from "./pages/guardians/GuardiansList.tsx";
import GuardiansCreate from "./pages/guardians/GuardiansCreate.tsx";
import GuardiansDetail from "./pages/guardians/GuardiansDetail.tsx";

import TeachersList from "./pages/teachers/TeachersList.tsx";
import TeachersCreate from "./pages/teachers/TeachersCreate.tsx";
import TeachersDetail from "./pages/teachers/TeachersDetail.tsx";

import ClassesList from "./pages/classes/ClassesList.tsx";
import ClassesCreate from "./pages/classes/ClassesCreate.tsx";

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />

            <Route path="/alunos" element={<ProtectedRoute><StudentsList /></ProtectedRoute>} />
            <Route path="/alunos/novo" element={<ProtectedRoute><StudentsCreate /></ProtectedRoute>} />
            <Route path="/alunos/:id" element={<ProtectedRoute><StudentsDetail /></ProtectedRoute>} />
            <Route path="/alunos/:id/editar" element={<ProtectedRoute><StudentsEdit /></ProtectedRoute>} />

            <Route path="/responsaveis" element={<ProtectedRoute><GuardiansList /></ProtectedRoute>} />
            <Route path="/responsaveis/novo" element={<ProtectedRoute><GuardiansCreate /></ProtectedRoute>} />
            <Route path="/responsaveis/:id" element={<ProtectedRoute><GuardiansDetail /></ProtectedRoute>} />
            <Route path="/responsaveis/:id/editar" element={<ProtectedRoute><GuardiansCreate /></ProtectedRoute>} />

            <Route path="/professores" element={<ProtectedRoute><TeachersList /></ProtectedRoute>} />
            <Route path="/professores/novo" element={<ProtectedRoute><TeachersCreate /></ProtectedRoute>} />
            <Route path="/professores/:id" element={<ProtectedRoute><TeachersDetail /></ProtectedRoute>} />
            <Route path="/professores/:id/editar" element={<ProtectedRoute><TeachersCreate /></ProtectedRoute>} />

            <Route path="/turmas" element={<ProtectedRoute><ClassesList /></ProtectedRoute>} />
            <Route path="/turmas/novo" element={<ProtectedRoute><ClassesCreate /></ProtectedRoute>} />
            <Route path="/turmas/:id/editar" element={<ProtectedRoute><ClassesCreate /></ProtectedRoute>} />

            <Route path="/notas" element={<ProtectedRoute><GradeEntry /></ProtectedRoute>} />
            <Route path="/notas/historico" element={<ProtectedRoute><GradeHistory /></ProtectedRoute>} />

            <Route path="/frequencia" element={<ProtectedRoute><AttendanceRecord /></ProtectedRoute>} />
            <Route path="/frequencia/consulta" element={<ProtectedRoute><AttendanceView /></ProtectedRoute>} />
            <Route path="/frequencia/relatorios" element={<ProtectedRoute><AttendanceReports /></ProtectedRoute>} />

            <Route path="/documentos" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/documentos-oficiais" element={<ProtectedRoute><OfficialDocuments /></ProtectedRoute>} />

            <Route path="/comunicacao" element={<ProtectedRoute><Communication /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
