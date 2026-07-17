export type EntityCode = 'hub' | 'lab' | 'ops';

export interface TeamMember {
  id: string;
  fullName: string;
  jobTitle: string | null;
  entityCode: EntityCode | null;
  entityName: string | null;
  phone: string | null;
  email: string;
  avatarUrl: string | null;
}

/** Categoría privacy-safe de una ausencia, tal cual la manda el backend.
 * NUNCA es el tipo real de ausencia: `baja_medica`/`duelo`/`asuntos_propios`/
 * `justificada`/`otros` llegan ya colapsados en `ausente` desde el backend
 * (dato sensible / categoría especial RGPD) — el frontend nunca ve ni pide
 * el motivo real. */
export type AbsenceKind = 'vacaciones' | 'remoto' | 'ausente';

/** Ausencias aprobadas de los compañeros del MISMO departamento que el
 * usuario que consulta — el backend resuelve el alcance por `department_id`
 * del solicitante, nunca por un parámetro del cliente (lectura del equipo,
 * no bandeja de RRHH). */
export interface TeamAbsenceEntry {
  userId: string;
  fullName: string;
  startDate: string;
  endDate: string;
  kind: AbsenceKind;
}

/** Cumpleaños dentro de la ventana consultada (widget "Cumpleaños esta
 * semana" del Inicio) — solo plantilla interna, nunca externos-invitado.
 * Por RGPD nunca incluye el año de nacimiento (no debe poder derivarse la
 * edad de nadie desde este widget): solo `day`/`month`. */
export interface TeamBirthday {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  day: number;
  month: number;
  isToday: boolean;
}
