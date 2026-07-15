import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AbsencesPage } from '@/features/absences/pages/AbsencesPage';
import { AbsenceTypesAdminPage } from '@/features/absences/pages/AbsenceTypesAdminPage';
import { AnunciosPage } from '@/features/announcements/pages/AnunciosPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { FestivosPage } from '@/features/holidays/pages/FestivosPage';
import { AdminMailboxPage } from '@/features/mailbox/pages/AdminMailboxPage';
import { AnonymousMailboxPage } from '@/features/mailbox/pages/AnonymousMailboxPage';
import { OnboardingPage } from '@/features/onboarding/pages/OnboardingPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { StaffPage } from '@/features/staff/pages/StaffPage';
import { TeamPage } from '@/features/team/pages/TeamPage';
import { TimeClockPage } from '@/features/time-clock/pages/TimeClockPage';
import { AppLayout } from '@/layouts/AppLayout/AppLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        {/* Backend rechaza al externo-invitado en ambos módulos
            (require_role) — aquí no hay guard de rol porque "ocultar ≠
            proteger" corta en ambos sentidos: el frontend tampoco es quien
            decide el acceso, solo compone la navegación. */}
        <Route path="/ausencias" element={<AbsencesPage />} />
        <Route path="/control-horario" element={<TimeClockPage />} />
        <Route path="/buzon-anonimo" element={<AnonymousMailboxPage />} />
        <Route path="/equipo" element={<TeamPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/administracion/plantilla" element={<StaffPage />} />
        <Route path="/administracion/buzon" element={<AdminMailboxPage />} />
        <Route path="/administracion/anuncios" element={<AnunciosPage />} />
        <Route path="/administracion/festivos" element={<FestivosPage />} />
        <Route path="/administracion/tipos-ausencia" element={<AbsenceTypesAdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
