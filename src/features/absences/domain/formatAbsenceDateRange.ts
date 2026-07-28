/**
 * Formato compacto de rango de fechas para las filas de "Mis solicitudes" /
 * "Próximas ausencias" (deck 03-ausencias-empleado): un solo día muestra
 * solo esa fecha, un rango muestra `inicio → fin`. Extraído de
 * `AbsenceCompactList` (donde vivía como función privada) para poder
 * reutilizarlo también en `UpcomingAbsencesCard` sin duplicar el formateo.
 */
export function formatAbsenceDateRange(startDate: string, endDate: string): string {
  const format = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
  return startDate === endDate ? format(startDate) : `${format(startDate)} → ${format(endDate)}`;
}
