/**
 * Fuente única del enum de roles del frontend. `socio` (migración backend
 * `024_socio_role.sql`) vivía duplicado en 3 copias locales —
 * `NavRole` (`layouts/AppLayout/nav-config.ts`), `StaffRole`
 * (`features/staff/domain/models.ts`) y `ProfileRole`
 * (`features/profile/domain/models.ts`) — porque cada feature se sumó en
 * paralelo sin tocar el dominio de auth. Se unifican aquí: los tres tipos
 * quedan eliminados y repuntan a `UserRole`.
 *
 * Sigue siendo una unión CERRADA en tiempo de compilación (no un `string`
 * abierto): añadir un rol nuevo en la tabla `roles` del backend requiere
 * sumarlo aquí (un solo archivo, no N) para que TypeScript conozca sus
 * literales. El SELECTOR de rol asignable de "Plantilla" (`StaffForm`) no
 * depende de esta lista para sus OPCIONES — esas se piden en runtime a
 * `GET /roles` (ver `features/roles`); esta unión solo tipa los lugares
 * que ya conocen el rol de antemano (JWT decodificado, badges de solo
 * lectura).
 */
export type UserRole = 'administrador' | 'empleado' | 'externo_invitado' | 'socio';

/** Mismos 4 valores de `UserRole`, como array — única lista permitida para
 * `parseEnum`/`parseEnumNullable` en los mappers que validan el `role`/
 * `role_code` que manda el backend (antes duplicada como `PROFILE_ROLES` en
 * `profile/infrastructure/mappers.ts` y `STAFF_ROLES` en
 * `staff/infrastructure/mappers.ts`). */
export const USER_ROLES: readonly UserRole[] = [
  'administrador',
  'empleado',
  'externo_invitado',
  'socio',
];

/** Etiqueta legible de cada rol — para los lugares que solo necesitan
 * mostrar el rol YA conocido del usuario actual (Topbar, "Mi perfil"), no
 * un selector de alta/edición. Esos SÍ necesitan la lista dinámica de
 * `GET /roles` (ver `features/roles/application/useRoles.ts`) porque son
 * exclusivos del admin; estos badges los ve cualquier rol y no pueden
 * llamar a un endpoint admin-only solo para etiquetar su propio badge. */
export const USER_ROLE_LABEL: Record<UserRole, string> = {
  administrador: 'Administrador',
  empleado: 'Empleado',
  externo_invitado: 'Externo-invitado',
  socio: 'Socio',
};

/** Helpers de rol — evitan repetir el literal `'administrador'`/
 * `'externo_invitado'` en cada feature que necesita ramificar por rol
 * (Sidebar, Dashboard, Ausencias, Control horario, Onboarding). */
export const isAdmin = (role?: UserRole | null): boolean => role === 'administrador';
export const isExternalGuest = (role?: UserRole | null): boolean => role === 'externo_invitado';

export interface AmeliaUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  entityId: string | null;
  departmentId: string | null;
  isExternal: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AmeliaUser;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
