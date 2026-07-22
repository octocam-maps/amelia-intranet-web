import { isAdmin } from '@/features/auth/domain/models';
import { useStore } from '@/store';
import { AdminAbsencesView } from '../components/AdminAbsencesView';
import { EmployeeAbsencesView } from '../components/EmployeeAbsencesView';

/**
 * Router de vista por rol — deck Fase 3 tiene dos pantallas de Ausencias
 * completamente distintas (03-ausencias-empleado vs 05-ausencias-admin), no
 * una sola pantalla con secciones condicionales como en la v1 de esta página.
 */
export function AbsencesPage() {
  const admin = useStore((s) => isAdmin(s.user?.role));
  return admin ? <AdminAbsencesView /> : <EmployeeAbsencesView />;
}
