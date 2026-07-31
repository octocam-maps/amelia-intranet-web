import { describe, expect, it } from 'vitest';
import {
  USER_ROLES,
  USER_ROLE_LABEL,
  canUseTimeClock,
  isAdmin,
  isExternalGuest,
} from './models';

describe('USER_ROLES / USER_ROLE_LABEL', () => {
  it('etiqueta todos los roles conocidos', () => {
    for (const role of USER_ROLES) {
      expect(USER_ROLE_LABEL[role], `falta la etiqueta de "${role}"`).toBeTruthy();
    }
  });

  it('muestra "Empleado" para el code `empleado`, igual que `roles.name`', () => {
    // La etiqueta coincide a propósito con `roles.name` de la BD: el selector de
    // rol de Administración > Plantilla pinta lo que llega de `GET /roles`, y
    // cuando aquí decía "Trabajador" convivían dos nombres para el mismo rol
    // según la pantalla. El móvil ya usaba "Empleado".
    expect(USER_ROLE_LABEL.empleado).toBe('Empleado');
    // El `code` NO se renombra: los 41 guards del backend y la tabla `roles`
    // dependen de `empleado`. Este test avisa si alguien lo "arregla" al revés.
    expect(USER_ROLES).toContain('empleado');
    expect(USER_ROLES).not.toContain('trabajador');
  });

  it('incluye el rol becario', () => {
    expect(USER_ROLES).toContain('becario');
    expect(USER_ROLE_LABEL.becario).toBe('Becario');
  });
});

describe('canUseTimeClock', () => {
  it('deja fichar a administrador, empleado y socio', () => {
    expect(canUseTimeClock('administrador')).toBe(true);
    expect(canUseTimeClock('empleado')).toBe(true);
    expect(canUseTimeClock('socio')).toBe(true);
  });

  it('no deja fichar a becario ni a externo-invitado', () => {
    // Debe coincidir con `TIME_CLOCK_ROLES` del backend
    // (`src/shared/auth/roles.py`), que es quien de verdad responde 403.
    expect(canUseTimeClock('becario')).toBe(false);
    expect(canUseTimeClock('externo_invitado')).toBe(false);
  });

  it('trata la ausencia de rol como "no puede"', () => {
    // Durante la hidratación de la sesión el rol es `undefined`: negar por
    // defecto evita el parpadeo de una pantalla que quizá no le corresponde.
    expect(canUseTimeClock(undefined)).toBe(false);
    expect(canUseTimeClock(null)).toBe(false);
  });
});

describe('isAdmin / isExternalGuest', () => {
  it('el becario no es admin ni externo', () => {
    expect(isAdmin('becario')).toBe(false);
    expect(isExternalGuest('becario')).toBe(false);
  });
});
