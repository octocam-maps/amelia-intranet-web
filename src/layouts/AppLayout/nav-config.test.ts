import { describe, expect, it } from 'vitest';
import { USER_ROLES, type UserRole } from '@/features/auth/domain/models';
import { ADMIN_SECTION_ITEMS, NAV_BY_ROLE, pageTitleForPath } from './nav-config';

const CONTROL_HORARIO = '/control-horario';

function pathsFor(role: UserRole): string[] {
  return NAV_BY_ROLE[role].map((item) => item.to);
}

describe('NAV_BY_ROLE', () => {
  it('declara una entrada por cada rol conocido', () => {
    // `Record<UserRole, …>` ya lo obliga en compilación; esto lo fija también
    // en runtime, para que un rol añadido a `USER_ROLES` sin su navbar no pase
    // como un sidebar vacío en vez de un error.
    for (const role of USER_ROLES) {
      expect(NAV_BY_ROLE[role], `falta el navbar de "${role}"`).toBeDefined();
      expect(NAV_BY_ROLE[role].length).toBeGreaterThan(0);
    }
  });

  it('el becario ve todo lo del trabajador MENOS control horario (RF-A10)', () => {
    const becario = pathsFor('becario');
    const empleado = pathsFor('empleado');

    expect(becario).not.toContain(CONTROL_HORARIO);
    expect(empleado).toContain(CONTROL_HORARIO);
    // La ÚNICA diferencia con un trabajador. Un `toEqual` sobre la lista
    // completa se rompería al reordenar el navbar; esto comprueba lo que de
    // verdad se prometió.
    expect(empleado.filter((path) => path !== CONTROL_HORARIO)).toEqual(becario);
  });

  it('el becario sí conserva ausencias, nóminas, documentos, equipo y buzón', () => {
    const becario = pathsFor('becario');
    for (const path of [
      '/ausencias',
      '/nominas',
      '/documentos',
      '/equipo',
      '/buzon-anonimo',
      '/onboarding',
    ]) {
      expect(becario, `el becario debería ver ${path}`).toContain(path);
    }
  });

  it('el becario no ve la sección Administración', () => {
    // El Sidebar la añade aparte, condicionada por `isAdmin` — nunca debe
    // colarse en el navbar base de ningún rol.
    const adminPaths = ADMIN_SECTION_ITEMS.map((item) => item.to);
    const exclusive = adminPaths.filter((path) => path.startsWith('/administracion'));
    for (const path of exclusive) {
      expect(pathsFor('becario')).not.toContain(path);
    }
  });

  it('el externo-invitado sigue con su navbar recortado', () => {
    // Regresión: la entrada del becario no debe haber ampliado al externo.
    expect(pathsFor('externo_invitado')).not.toContain(CONTROL_HORARIO);
    expect(pathsFor('externo_invitado')).not.toContain('/ausencias');
  });
});

describe('pageTitleForPath', () => {
  it('resuelve el título desde el navbar del rol', () => {
    expect(pageTitleForPath('/ausencias', 'becario')).toBe('Ausencias');
  });

  it('no da título de control horario a un becario', () => {
    // Si algún día se le habilita la ruta, el título saldría vacío antes que
    // mentir con una pantalla que su rol no tiene.
    expect(pageTitleForPath(CONTROL_HORARIO, 'becario')).toBe('');
    expect(pageTitleForPath(CONTROL_HORARIO, 'empleado')).not.toBe('');
  });
});
