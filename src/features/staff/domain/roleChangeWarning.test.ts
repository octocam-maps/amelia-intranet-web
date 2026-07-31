import { describe, expect, it } from 'vitest';
import { buildRoleChangeWarning } from './roleChangeWarning';

describe('buildRoleChangeWarning', () => {
  it('no avisa cuando el rol no cambia', () => {
    // Quien llama usa el `null` para no preguntar: confirmar un cambio que no
    // existe entrena al admin a aceptar diálogos sin leerlos.
    expect(buildRoleChangeWarning('Ana Ruiz', 'empleado', 'empleado')).toBeNull();
  });

  it('al promocionar de becario a empleado avisa de que se habilita el fichaje', () => {
    const warning = buildRoleChangeWarning('Miquel Sala', 'becario', 'empleado');

    expect(warning).toContain('Miquel Sala pasa de Becario a Empleado.');
    expect(warning).toContain('Se le habilita el registro horario.');
  });

  it('al pasar a becario avisa de que pierde el fichaje y de que se conservan sus fichajes', () => {
    const warning = buildRoleChangeWarning('Ana Ruiz', 'empleado', 'becario');

    expect(warning).toContain('Deja de tener registro horario.');
    expect(warning).toContain('Sus fichajes anteriores se conservan.');
  });

  it('promete siempre que se conserva la antigüedad', () => {
    // Es lo primero que pregunta RRHH al promocionar a un becario, y la promesa
    // es cierta porque `hire_date` no forma parte del PATCH.
    const warning = buildRoleChangeWarning('Miquel Sala', 'becario', 'empleado');

    expect(warning).toContain('Conserva su fecha de alta, su antigüedad');
  });

  it('advierte siempre de que se cierra la sesión', () => {
    // El backend revoca las sesiones al cambiar el rol; si el aviso no lo dice,
    // el admin no entiende por qué a esa persona la ha echado de la intranet.
    for (const [from, to] of [
      ['becario', 'empleado'],
      ['empleado', 'administrador'],
      ['socio', 'empleado'],
    ] as const) {
      expect(buildRoleChangeWarning('X', from, to)).toContain('Se cerrará su sesión');
    }
  });

  it('no menciona el fichaje cuando ninguno de los dos roles lo tenía', () => {
    // Externo -> becario: ninguno ficha, así que hablar de fichaje sería ruido.
    const warning = buildRoleChangeWarning('Colaborador', 'externo_invitado', 'becario');

    expect(warning).not.toContain('registro horario');
  });

  it('tampoco lo menciona cuando los dos roles lo tienen', () => {
    const warning = buildRoleChangeWarning('Ana Ruiz', 'empleado', 'administrador');

    expect(warning).not.toContain('registro horario');
  });
});
