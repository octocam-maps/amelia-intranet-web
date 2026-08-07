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
export type UserRole =
  | 'administrador'
  | 'empleado'
  | 'externo_invitado'
  | 'socio'
  | 'becario'
  | 'tecnico';

/** Mismos 6 valores de `UserRole`, como array — única lista permitida para
 * `parseEnum`/`parseEnumNullable` en los mappers que validan el `role`/
 * `role_code` que manda el backend (antes duplicada como `PROFILE_ROLES` en
 * `profile/infrastructure/mappers.ts` y `STAFF_ROLES` en
 * `staff/infrastructure/mappers.ts`). */
export const USER_ROLES: readonly UserRole[] = [
  'administrador',
  'empleado',
  'externo_invitado',
  'socio',
  'becario',
  'tecnico',
];

/** Etiqueta legible de cada rol — para los lugares que solo necesitan
 * mostrar el rol YA conocido del usuario actual (Topbar, "Mi perfil"), no
 * un selector de alta/edición. Esos SÍ necesitan la lista dinámica de
 * `GET /roles` (ver `features/roles/application/useRoles.ts`) porque son
 * exclusivos del admin; estos badges los ve cualquier rol y no pueden
 * llamar a un endpoint admin-only solo para etiquetar su propio badge. */
export const USER_ROLE_LABEL: Record<UserRole, string> = {
  administrador: 'Administrador',
  // "Empleado", igual que `roles.name` en la BD (decisión del team-lead,
  // 2026-07-31). Antes decía "Trabajador" y eso dejaba DOS nombres para el mismo
  // rol conviviendo en la aplicación: el selector de rol de Administración >
  // Plantilla pinta `role.name` tal como llega de `GET /roles`, o sea "Empleado",
  // mientras estos badges decían "Trabajador". Y el móvil ya usaba "Empleado" en
  // su puerto de este mapa, así que la divergencia era también entre plataformas.
  //
  // El `code` del backend sigue siendo `empleado` y no se toca: renombrarlo
  // obligaría a una migración de datos y a tocar los 41 guards que lo nombran,
  // para no ganar nada funcional.
  empleado: 'Empleado',
  externo_invitado: 'Externo-invitado',
  socio: 'Socio',
  becario: 'Becario',
  tecnico: 'Técnico',
};

/** Helpers de rol — evitan repetir el literal `'administrador'`/
 * `'externo_invitado'` en cada feature que necesita ramificar por rol
 * (Sidebar, Dashboard, Ausencias, Control horario, Onboarding). */
export const isAdmin = (role?: UserRole | null): boolean => role === 'administrador';
export const isExternalGuest = (role?: UserRole | null): boolean => role === 'externo_invitado';

/** Quién usa el FICHAJE POR TRAMOS (reloj en vivo, alta manual, alta en lote).
 *
 * Lista POSITIVA, y el cambio es deliberado: antes se escribía por exclusión
 * (`!== 'externo_invitado' && !== 'becario'`) y eso convertía cada rol nuevo en
 * un permiso concedido por defecto. Al entrar `tecnico` [migración backend
 * `051_tecnico_role.sql`] la versión antigua le habría dado acceso al fichaje
 * por tramos, que es justo lo que NO usa: él cumplimenta un parte diario. Con
 * la lista positiva, un rol futuro que nadie recuerde clasificar se queda
 * fuera — que es el fallo seguro.
 *
 * Espejo exacto de `TIME_CLOCK_ROLES` en `src/shared/auth/roles.py`.
 *
 * Ocultar ≠ proteger: esto solo evita ofrecer una pantalla que el backend va a
 * negar con un 403. La autorización real vive allí. */
export const canUseTimeClock = (role?: UserRole | null): boolean =>
  role === 'administrador' || role === 'empleado' || role === 'socio';

/** Quién cumplimenta el PARTE DIARIO del técnico (requerimiento v1.2 §M1):
 * proyecto, lugar, horario, pausa, pernocta y categoría de producto, uno por
 * día, con bolsa mensual de 162 h.
 *
 * Espejo de `TECHNICIAN_ROLES` en `src/shared/auth/roles.py`. El administrador
 * NO entra aquí: consulta y corrige partes ajenos, pero no rellena el suyo —
 * para eso está `canReviewTechnicianLogs`. */
export const canUseTechnicianLog = (role?: UserRole | null): boolean => role === 'tecnico';

/** Quién puede VER y corregir partes: el propio técnico y el administrador
 * (que además elige de quién y descarga el Excel del mes). */
export const canReviewTechnicianLogs = (role?: UserRole | null): boolean =>
  role === 'tecnico' || role === 'administrador';

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
