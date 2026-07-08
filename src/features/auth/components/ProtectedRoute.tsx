import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/PageLoader';
import { useStore } from '@/store';

/**
 * Solo verifica que haya sesión. El control de acceso por rol a rutas/vistas
 * concretas vive en `RequireRole` (Fase 2+) — aquí no se decide el navbar,
 * solo "¿puede entrar a la app autenticada?". La protección real de cada
 * módulo la hace siempre el backend (`require_role`), nunca el frontend.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const authSessionReady = useStore((s) => s.authSessionReady);
  const isAuthenticated = useStore((s) => s.isAuthenticated());

  if (!authSessionReady) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
