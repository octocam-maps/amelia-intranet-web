import { describe, expect, it } from 'vitest';
import { SCREENS } from '../../e2e/screens';
import type { E2ERole } from '../../e2e/fixtures/users';
import {
  ADMIN_SECTION_ITEMS,
  NAV_BY_ROLE,
  pageTitleForPath,
} from '../layouts/AppLayout/nav-config';
import type { UserRole } from '../features/auth/domain/models';

/**
 * Guardia de cobertura de los E2E.
 *
 * El catálogo de `e2e/screens.ts` está escrito a mano (importar `nav-config`
 * dentro del runner de Playwright arrastraría JSX y el alias `@`), así que sin
 * este test se quedaría obsoleto en silencio: alguien añade un módulo al
 * navbar, nadie añade su pantalla al catálogo, y la suite E2E sigue en verde
 * mientras deja una pantalla entera sin auditar.
 *
 * Vive en `src/test/` y no en `e2e/` porque Vitest sí resuelve el alias y los
 * iconos, y porque `vite.config.ts` excluye `e2e/` de Vitest a propósito.
 */

/** `becario` y `externo_invitado` se llaman igual en ambos lados a propósito. */
const E2E_ROLE_IS_USER_ROLE: Record<E2ERole, UserRole> = {
  administrador: 'administrador',
  empleado: 'empleado',
  socio: 'socio',
  becario: 'becario',
  externo_invitado: 'externo_invitado',
};

describe('catálogo de pantallas E2E', () => {
  it('cubre todas las rutas del navbar de todos los roles', () => {
    const cataloged = new Set(SCREENS.map((s) => s.path));
    const missing: string[] = [];

    for (const role of Object.keys(NAV_BY_ROLE) as UserRole[]) {
      for (const item of NAV_BY_ROLE[role]) {
        if (item.comingSoon) continue; // sin página real todavía
        if (!cataloged.has(item.to)) missing.push(`${role} → ${item.to} (${item.label})`);
      }
    }

    expect(
      missing,
      'Rutas en el navbar que NO están en e2e/screens.ts: quedarían sin auditar.',
    ).toEqual([]);
  });

  it('cubre todas las rutas de la sección Administración', () => {
    const cataloged = new Set(SCREENS.map((s) => s.path));
    const missing = ADMIN_SECTION_ITEMS.filter(
      (item) => !item.comingSoon && !cataloged.has(item.to),
    ).map((item) => `${item.to} (${item.label})`);

    expect(missing).toEqual([]);
  });

  it('declara el título que el Topbar mostrará de verdad para cada pantalla y rol', () => {
    /* Esto es lo que convierte el catálogo en algo más que una lista de URLs:
       si el título esperado no coincide con el que calcula la app, el test E2E
       esperaría un `<h1>` que nunca aparece y fallaría con un timeout opaco. */
    const mismatches: string[] = [];

    for (const screen of SCREENS) {
      for (const role of screen.roles) {
        const actual = pageTitleForPath(screen.path, E2E_ROLE_IS_USER_ROLE[role]);
        if (actual !== screen.title) {
          mismatches.push(
            `${screen.path} [${role}]: el catálogo dice "${screen.title}" y la app "${actual}"`,
          );
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it('no declara una pantalla para un rol que no la tiene en su navbar', () => {
    /* El caso contrario al primer test: auditar una ruta que el rol no tiene
       la abriría igualmente (no hay guard de rol en el router), el backend
       respondería 403 y el fallo parecería un bug de la pantalla. */
    const wrong: string[] = [];

    for (const screen of SCREENS) {
      for (const role of screen.roles) {
        const userRole = E2E_ROLE_IS_USER_ROLE[role];
        const inNav = NAV_BY_ROLE[userRole].some((item) => item.to === screen.path);
        const inAdminSection =
          userRole === 'administrador' &&
          ADMIN_SECTION_ITEMS.some((item) => item.to === screen.path);
        /* Las subrutas (p. ej. el seguimiento del buzón) cuelgan de un ítem del
           navbar sin ser un ítem propio: valen si su padre está. */
        const isSubroute = NAV_BY_ROLE[userRole].some(
          (item) => item.to !== '/' && screen.path.startsWith(`${item.to}/`),
        );

        if (!inNav && !inAdminSection && !isSubroute) {
          wrong.push(`${screen.path} declarado para ${role}, que no lo tiene en su navbar`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });

  it('cada pantalla tiene un id único (los ids nombran los baselines)', () => {
    const ids = SCREENS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
