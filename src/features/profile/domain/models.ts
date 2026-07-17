import type { UserRole } from '@/features/auth/domain/models';

/**
 * Ficha de `GET /profile/me`. Con los datos actuales casi todos los campos
 * opcionales llegan `null` (plantilla sin entidad, departamento, manager,
 * puesto ni fecha de alta asignados todavía) — se tipan como `| null`
 * explícito y NUNCA se castean a no-null en la UI (ver incidente de
 * TeamDirectory con `.charAt` sobre null).
 *
 * Lote 2: `phone`/`city` son los ÚNICOS campos editables por el propio
 * usuario (`PATCH /profile/me`) — el resto (entidad, departamento, manager,
 * puesto, fecha de alta…) lo gestiona el admin desde `/staff` y aquí es de
 * solo lectura.
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
  phone: string | null;
  city: string | null;
}

/** Body de `PATCH /profile/me` — ambos opcionales (actualización parcial:
 * solo se envía lo que cambió, semántica PATCH tanto en el cliente como en
 * el backend). */
export interface UpdateMyProfileInput {
  phone?: string;
  city?: string;
}
