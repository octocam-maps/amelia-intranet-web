import type { Role } from './models';

export interface RoleRepository {
  /** `GET /roles` — exclusivo del admin (backend `require_role`); solo
   * `StaffForm` ("Plantilla") lo consume hoy. */
  list(): Promise<Role[]>;
}
