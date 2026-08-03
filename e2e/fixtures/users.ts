/**
 * Catálogo de identidades E2E, una por rol del producto
 * (`amelia-intranet/docs/permisos-roles.md`).
 *
 * El id_token es sintético y solo lo acepta el backend con
 * `GOOGLE_OIDC_PROVIDER=fake`. El formato lo define
 * `amelia-intranet-back/src/shared/google_oidc/fake_verifier.py` — si cambia
 * allí, cambia aquí.
 *
 * `hostedDomain` es lo que decide el alta: con un dominio del Workspace
 * (`GOOGLE_WORKSPACE_HOSTED_DOMAINS`) el backend auto-provisiona como
 * `empleado`; sin él hace falta una invitación pendiente. De ahí que
 * `empleado` no necesite semilla y `externo` sí.
 */

export type E2ERole = 'administrador' | 'empleado' | 'socio' | 'externo';

export interface E2EUser {
  role: E2ERole;
  sub: string;
  email: string;
  fullName: string;
  hostedDomain?: string;
  /** Cómo llega a existir en la BD. `seed` = necesita `e2e/seed/e2e-users.sql`. */
  provisioning: 'init.sql' | 'auto' | 'seed';
}

export const E2E_USERS: Record<E2ERole, E2EUser> = {
  /* Beatriz Luna, la única administradora. Ya viene sembrada en `init.sql`
     con status `invited`; el primer login la pasa a `active`. */
  administrador: {
    role: 'administrador',
    sub: 'e2e-administrador',
    email: 'people@ameliahub.com',
    fullName: 'Beatriz Luna',
    hostedDomain: 'ameliahub.com',
    provisioning: 'init.sql',
  },

  /* No necesita semilla: el claim `hd` del Workspace dispara la
     auto-provisión como `empleado` `active` en el primer login. */
  empleado: {
    role: 'empleado',
    sub: 'e2e-empleado',
    email: 'e2e.empleado@ameliahub.com',
    fullName: 'Elena Empleada',
    hostedDomain: 'ameliahub.com',
    provisioning: 'auto',
  },

  /* El rol `socio` no se auto-asigna nunca (un email @ameliahub.com sin
     semilla entraría como `empleado`). Requiere `e2e/seed/e2e-users.sql`. */
  socio: {
    role: 'socio',
    sub: 'e2e-socio',
    email: 'e2e.socio@ameliahub.com',
    fullName: 'Sergio Socio',
    hostedDomain: 'ameliahub.com',
    provisioning: 'seed',
  },

  /* Sin `hostedDomain` a propósito: simula el Gmail personal de un
     externo-invitado, que solo entra con invitación pendiente. */
  externo: {
    role: 'externo',
    sub: 'e2e-externo',
    email: 'e2e.externo@gmail.com',
    fullName: 'Extranjero Invitado',
    provisioning: 'seed',
  },
};

/** Réplica en TS de `build_fake_id_token` del backend. */
export function buildFakeIdToken(user: E2EUser): string {
  const payload: Record<string, unknown> = {
    sub: user.sub,
    email: user.email,
    email_verified: true,
    name: user.fullName,
  };
  if (user.hostedDomain) payload.hd = user.hostedDomain;

  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8')
    .toString('base64url')
    .replace(/=+$/, '');
  return `fake-google-id-token.${encoded}`;
}
