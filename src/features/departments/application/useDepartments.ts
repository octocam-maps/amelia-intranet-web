import { useQuery } from '@tanstack/react-query';
import { departmentsApiAdapter } from '../infrastructure/departments-api.adapter';

interface UseDepartmentsOptions {
  /** `GET /departments` exige un rol interno con onboarding completo
   * (`administrador`/`empleado`/`socio`) — quien llame a este hook fuera de
   * una de esas pantallas debe pasar `enabled: false` para no disparar la
   * request y su 403 (mismo patrón que `useRoles`). */
  enabled?: boolean;
}

/** Fuente única de "qué departamentos existen" para poblar selectores —
 * hoy, el Paso 5 del onboarding (`ProfileStep`). Los departamentos casi no
 * cambian — `staleTime` largo, igual que `useRoles`. */
export function useDepartments(options: UseDepartmentsOptions = {}) {
  return useQuery({
    queryKey: ['departments', 'list'],
    queryFn: () => departmentsApiAdapter.list(),
    staleTime: 5 * 60_000,
    enabled: options.enabled ?? true,
  });
}
