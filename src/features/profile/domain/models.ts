import type { UserRole } from '@/features/auth/domain/models';

/**
 * Ficha de solo lectura de `GET /profile/me`. Con los datos actuales casi
 * todos los campos opcionales llegan `null` (plantilla sin entidad,
 * departamento, manager, puesto ni fecha de alta asignados todavía) — se
 * tipan como `| null` explícito y NUNCA se castean a no-null en la UI
 * (ver incidente de TeamDirectory con `.charAt` sobre null).
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  jobTitle: string | null;
  hireDate: string | null;
  entityName: string | null;
  departmentName: string | null;
  managerName: string | null;
  isExternal: boolean;
}
