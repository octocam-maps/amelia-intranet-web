/**
 * Presets de mes/año natural del "Calendario general de la plantilla"
 * (RF-A1.2) — se resuelven en el CLIENTE, sin parámetro nuevo en el
 * backend: el backend ya acepta cualquier `date_from`/`date_to`, esto solo
 * calcula qué rango pedirle. Extraído de `AbsenceGeneralCalendarPage` para
 * poder testear el cálculo de fechas sin montar la página completa.
 */
export interface CalendarPresetRange {
  dateFrom: string;
  dateTo: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** 1º al último día del mes del `cursor` — `new Date(year, month + 1, 0)`
 * delega en el propio motor de fechas de JS el desborde de mes (diciembre
 * -> enero del año siguiente) y los años bisiestos (28/29 de febrero), sin
 * lógica de calendario manual. */
export function monthRange(cursor: Date): CalendarPresetRange {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(daysInMonth)}`,
  };
}

/** 1 de enero a 31 de diciembre del año del `cursor` — mismo rango para
 * PDF y Excel, año natural completo del mes que se está viendo. */
export function yearRange(cursor: Date): CalendarPresetRange {
  const year = cursor.getFullYear();
  return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
}
