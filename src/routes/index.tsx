import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { AbsencesPage } from '@/features/absences/pages/AbsencesPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AdminMailboxPage } from '@/features/mailbox/pages/AdminMailboxPage';
import { AnonymousMailboxPage } from '@/features/mailbox/pages/AnonymousMailboxPage';
import { StaffPage } from '@/features/staff/pages/StaffPage';
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
        <Route path="/administracion/plantilla" element={<StaffPage />} />
        <Route path="/administracion/buzon" element={<AdminMailboxPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
