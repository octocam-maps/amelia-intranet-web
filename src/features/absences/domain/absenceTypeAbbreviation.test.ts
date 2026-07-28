import { describe, expect, it } from 'vitest';
import { getAbsenceTypeAbbreviation } from './absenceTypeAbbreviation';

// RF-A5.7 (WCAG 1.4.1): con 10 tipos de ausencia, el color deja de ser
// suficiente para distinguirlos bajo dicromacia (ver engram
// sdd/ampliacion-v11-rrhh/verificacion-paleta-accesibilidad). Este segundo
// canal es una abreviatura de 2 letras derivada del NOMBRE del tipo (no del
// `code`), porque `AbsenceCalendarEntry` (calendario general) solo trae
// `absenceTypeName`, no `code` — una única función sirve a ambos modelos.
describe('getAbsenceTypeAbbreviation', () => {
  it.each([
    ['Vacaciones', 'VA'],
    ['Enfermedades', 'EN'],
    ['Asuntos propios', 'AP'],
    ['Remoto', 'RE'],
    ['Justificada', 'JU'],
    ['Otros', 'OT'],
    ['Permiso Matrimonio', 'PM'],
    ['Paternidad', 'PA'],
    ['Enfermedad de un familiar', 'EF'],
    ['Descanso por horas extra', 'DH'],
    ['Bloqueado', 'BL'],
    ['Fallecimiento Familiar', 'FF'],
  ])('mapea "%s" -> "%s"', (name, expected) => {
    expect(getAbsenceTypeAbbreviation(name)).toBe(expected);
  });

  it('no genera colisiones entre los 12 tipos conocidos (activos + retirados)', () => {
    const names = [
      'Vacaciones', 'Enfermedades', 'Asuntos propios', 'Remoto',
      'Justificada', 'Otros', 'Permiso Matrimonio', 'Paternidad',
      'Enfermedad de un familiar', 'Descanso por horas extra', 'Bloqueado',
      'Fallecimiento Familiar',
    ];
    const abbreviations = names.map(getAbsenceTypeAbbreviation);
    expect(new Set(abbreviations).size).toBe(names.length);
  });

  it('devuelve un fallback legible (2 letras) para un nombre no mapeado, sin romper', () => {
    expect(getAbsenceTypeAbbreviation('Excedencia')).toBe('EX');
  });

  it('devuelve un guion largo si no hay nombre', () => {
    expect(getAbsenceTypeAbbreviation(null)).toBe('—');
    expect(getAbsenceTypeAbbreviation(undefined)).toBe('—');
    expect(getAbsenceTypeAbbreviation('')).toBe('—');
  });
});
