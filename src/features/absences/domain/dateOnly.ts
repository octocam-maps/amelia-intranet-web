/**
 * Fecha-only en hora LOCAL a partir de un ISO `YYYY-MM-DD` — evita el bug de
 * `new Date('2026-07-28')` (se interpreta en UTC y puede "caer" un día antes
 * en zonas con offset negativo). Extraído de los usos ya existentes en
 * `AbsenceMonthCalendar`/`TeamCalendar` para no duplicarlo en cada archivo
 * de dominio nuevo que necesite comparar fechas (pestañas de "Mis
 * solicitudes", "Próximas ausencias", "Ausencias del equipo (hoy)").
 */
export function toDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
