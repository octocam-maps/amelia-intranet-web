import type { AbsenceKind, TeamAbsenceEntry } from '@/features/team/domain/models';

import { toDateOnly } from './dateOnly';

/**
 * Compañeros del MISMO departamento que hoy no están, para el panel
 * "Ausencias del equipo (hoy)" de la columna derecha.
 *
 * El alcance y la privacidad los decide el BACKEND, no este filtro:
 * `GET /team/vacation-calendar` ya devuelve solo el departamento del
 * solicitante, solo ausencias APROBADAS, y un `kind` deliberadamente
 * privacy-safe (`vacaciones` | `remoto` | `ausente`) que agrupa bajo
 * `ausente` todo lo sensible — baja médica, duelo, etc. (RGPD, y
 * `docs/permisos-roles.md`: el empleado ve períodos, nunca el tipo real).
 *
 * Por eso aquí SOLO se recorta el mes al día de hoy. No cruzar nunca estas
 * entradas con `/absences` para "enriquecer" el motivo: reintroduciría
 * exactamente la fuga que el backend evita a propósito.
 */
export function selectTeamAbsencesToday(
  entries: TeamAbsenceEntry[],
  today: Date
): TeamAbsenceEntry[] {
  return entries
    .filter((entry) => toDateOnly(entry.startDate) <= today && toDateOnly(entry.endDate) >= today)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'es'));
}

/** Etiqueta en español del `kind` privacy-safe que expone el backend. */
export function teamAbsenceKindLabel(kind: AbsenceKind): string {
  switch (kind) {
    case 'vacaciones':
      return 'De vacaciones';
    case 'remoto':
      return 'Teletrabajando';
    default:
      return 'Ausente';
  }
}
