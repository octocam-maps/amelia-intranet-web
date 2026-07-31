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

  it('muestra "Trabajador" para el code `empleado`', () => {
    // RRHH lo llama Trabajador; el `code` del backend sigue siendo `empleado`.
    // Este test es el que avisa si alguien "arregla" la etiqueta renombrando el
    // code, que rompería los guards del backend y la tabla `roles`.
    expect(USER_ROLE_LABEL.empleado).toBe('Trabajador');
    expect(USER_ROLES).toContain('empleado');
    expect(USER_ROLES).not.toContain('trabajador');
  });

  it('incluye el rol becario', () => {
    expect(USER_ROLES).toContain('becario');
    expect(USER_ROLE_LABEL.becario).toBe('Becario');
  });
});

describe('canUseTimeClock', () => {
  it('deja fichar a administrador, trabajador y socio', () => {
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
