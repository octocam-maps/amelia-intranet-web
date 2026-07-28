/**
 * RF-A5.7 (WCAG 1.4.1 — Use of Color): con el catálogo ampliado a 10 tipos
 * de ausencia (migración 032), el color deja de bastar para distinguirlos —
 * bajo dicromacia rojo-verde solo quedan 2 ejes perceptuales útiles para 10
 * categorías (ver engram
 * `sdd/ampliacion-v11-rrhh/verificacion-paleta-accesibilidad`). Este segundo
 * canal es una abreviatura corta (2 letras) que se pinta junto al color en
 * cada chip/barra del calendario de ausencias.
 *
 * Se indexa por NOMBRE (no por `code`) a propósito: `AbsenceCalendarEntry`
 * (calendario general de la plantilla, `GET /absences/calendar/all`) solo
 * trae `absenceTypeName` resuelto por el backend, no el `code` — indexar por
 * nombre permite una única función para las 3 vistas de calendario
 * (personal, general, plantilla) sin tocar el backend para exponer `code`.
 */
const ABSENCE_TYPE_ABBREVIATION: Record<string, string> = {
  Vacaciones: 'VA',
  Enfermedades: 'EN',
  'Asuntos propios': 'AP',
  Remoto: 'RE',
  Justificada: 'JU',
  Otros: 'OT',
  'Permiso Matrimonio': 'PM',
  Paternidad: 'PA',
  'Enfermedad de un familiar': 'EF',
  'Descanso por horas extra': 'DH',
  Bloqueado: 'BL',
  'Fallecimiento Familiar': 'FF',
};

/**
 * Devuelve la abreviatura de 2 letras para el nombre de un tipo de ausencia.
 * Si el nombre no está en el mapa (tipo futuro añadido por RRHH sin pasar
 * por este fichero), cae a las 2 primeras letras del nombre en mayúsculas —
 * no es garantía de unicidad, pero mantiene el segundo canal presente en
 * vez de desaparecer silenciosamente.
 */
export function getAbsenceTypeAbbreviation(name: string | null | undefined): string {
  if (!name) return '—';
  const known = ABSENCE_TYPE_ABBREVIATION[name];
  if (known) return known;
  const letters = name.replace(/[^\p{L}]/gu, '').slice(0, 2).toUpperCase();
  return letters || '—';
}
