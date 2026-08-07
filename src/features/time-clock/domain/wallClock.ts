/**
 * Conversión entre la HORA DE PARED que elige la persona ("entré a las 08:00")
 * y el instante absoluto que viaja al backend.
 *
 * Existe porque hacerlo mal tiene consecuencia contable, no estética. El alta
 * manual enviaba `` `${workDate}T${hora}:00Z` ``: pegaba una `Z` a una hora
 * local, así que "las 08:00" se guardaba como 08:00 UTC — las 10:00 de Madrid
 * en verano. El listado lo disimulaba (leía el ISO en crudo con `slice`, así
 * que volvía a mostrar 08:00), pero el informe XLSX de RRHH convierte a Madrid
 * y ahí salía 10:00. Pantalla y registro legal de jornada decían cosas
 * distintas del mismo tramo.
 *
 * Regla: al ENVIAR se construye el instante desde la zona del navegador (que
 * para la plantilla es Madrid); al MOSTRAR se vuelve a hora local. Nunca se
 * manipula la cadena ISO a mano.
 */

/** `'08:30'` → 510. Un único punto de parseo de la hora de pared. */
export function minutesOfDay(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Combina fecha + hora de pared en un ISO con offset real.
 *
 * `addDays` sirve para la jornada que termina de madrugada: la hora de fin
 * pertenece al día siguiente aunque el tramo se impute al de inicio.
 */
export function toIsoDateTime(workDate: string, time: string, addDays = 0): string {
  const total = minutesOfDay(time);
  const date = new Date(`${workDate}T00:00:00`);
  date.setDate(date.getDate() + addDays);
  date.setHours(Math.floor(total / 60), total % 60, 0, 0);
  return date.toISOString();
}

/** Hora de pared local de un ISO (`'HH:MM'`), para pintar y para rellenar
 * formularios al editar. */
export function toTimeInput(isoDateTime: string): string {
  const date = new Date(isoDateTime);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Fecha LOCAL de un ISO en formato `'YYYY-MM-DD'`. `sv-SE` da exactamente ese
 * formato sin construirlo a mano a partir de getFullYear/getMonth. */
export function toLocalDate(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleDateString('sv-SE');
}
