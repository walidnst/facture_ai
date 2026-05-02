import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { RoleGuard }    from "./components/RoleGuard";
import Navbar           from "./components/Navbar";

import Landing          from "./pages/Landing";
import LoginPage        from "./pages/LoginPage";
import UploadPage       from "./components/UploadForm";
import ListeFactures    from "./pages/ListeFactures";
import Dashboard        from "./pages/Dashboard";
import UsersPage        from "./pages/UsersPage";
import CompaniesPage    from "./pages/CompaniesPage";
import ProfilPage       from "./pages/ProfilPage";
import Page403          from "./pages/Page403";
import ChatPage         from "./pages/ChatPage";
import AuditPage        from "./pages/AuditPage";   // ✅ NOUVEAU

function AppLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403"   element={<Page403 />} />

          <Route element={<AppLayout />}>
            <Route path="/upload" element={
              <RoleGuard roles={["USER", "ADMIN", "SUPER_ADMIN"]}><UploadPage /></RoleGuard>
            } />
            <Route path="/factures" element={
              <RoleGuard roles={["USER", "ADMIN", "SUPER_ADMIN"]}><ListeFactures /></RoleGuard>
            } />
            <Route path="/profil" element={
              <RoleGuard roles={["USER", "ADMIN", "SUPER_ADMIN"]}><ProfilPage /></RoleGuard>
            } />
            <Route path="/dashboard" element={
              <RoleGuard roles={["ADMIN", "SUPER_ADMIN"]}><Dashboard /></RoleGuard>
            } />
            <Route path="/users" element={
              <RoleGuard roles={["ADMIN", "SUPER_ADMIN"]}><UsersPage /></RoleGuard>
            } />
            <Route path="/companies" element={
              <RoleGuard roles={["SUPER_ADMIN"]}><CompaniesPage /></RoleGuard>
            } />
            <Route path="/chat" element={
              <RoleGuard roles={["USER", "ADMIN", "SUPER_ADMIN"]}><ChatPage /></RoleGuard>
            } />

            {/* ✅ NOUVEAU : Journal d'audit — Admin et Super Admin uniquement */}
            <Route path="/audit" element={
              <RoleGuard roles={["ADMIN", "SUPER_ADMIN"]}><AuditPage /></RoleGuard>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}