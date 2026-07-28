/** Tope de días por lote — mismo valor que `MAX_BATCH_DAYS` en el backend
 * (`create_time_clock_entries_batch.py`), duplicado aquí SOLO para validar
 * en cliente antes de enviar (mejor UX). El backend sigue siendo la única
 * autoridad: esta validación nunca sustituye al 422 real. */
export const BATCH_MAX_DAYS = 7;

export interface BatchRangeValidationResult {
  valid: boolean;
  error?: string;
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/**
 * Valida en cliente el tope de días y la fecha futura ANTES de enviar el
 * lote — mejor UX, pero SIN pretender ser la fuente de verdad: el backend
 * clasifica día a día con festivos/ausencias reales (datos que el cliente
 * no tiene), así que aquí solo se descarta el sábado/domingo del chequeo de
 * "futuro" (mismo espíritu que el orden de evaluación del backend: un fin
 * de semana nunca genera un tramo, así que nunca debería bloquear el envío
 * por sí solo). Un festivo o una ausencia aprobada futura SÍ podrían pasar
 * esta validación y aun así ser aceptados por el backend — eso es correcto,
 * no un bug: el backend tiene más información que el cliente.
 */
export function validateBatchRange(
  dateFrom: string,
  dateTo: string,
  todayIso: string
): BatchRangeValidationResult {
  if (!dateFrom || !dateTo) {
    return { valid: false, error: 'Selecciona la fecha de inicio y la fecha de fin.' };
  }
  if (dateFrom > dateTo) {
    return {
      valid: false,
      error: 'La fecha de inicio no puede ser posterior a la fecha de fin.',
    };
  }

  const from = parseIsoDate(dateFrom);
  const to = parseIsoDate(dateTo);
  const diffDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (diffDays > BATCH_MAX_DAYS) {
    return {
      valid: false,
      error: `El lote no puede abarcar más de ${BATCH_MAX_DAYS} días.`,
    };
  }

  const today = parseIsoDate(todayIso);
  const cursor = new Date(from);
  while (cursor.getTime() <= to.getTime()) {
    const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    if (!isWeekend && cursor.getTime() > today.getTime()) {
      return {
        valid: false,
        error:
          'El rango incluye un día laborable futuro sin festivo/ausencia que lo cubra — el backend rechazará el lote completo.',
      };
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return { valid: true };
}
