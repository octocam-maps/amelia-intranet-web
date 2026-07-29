import { toDateOnly } from './dateOnly';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Etiqueta de cuenta atrás para el panel "Próximas ausencias": "Empieza hoy",
 * "Mañana" o "En N días".
 *
 * El cálculo se hace sobre fechas-only (medianoche local, vía `toDateOnly`) y
 * NO sobre instantes: restar dos `Date` con hora produciría 0,7 días entre
 * ayer por la noche y hoy por la mañana, y el redondeo daría un día de más o
 * de menos según la hora a la que se abriera la pantalla.
 *
 * Defensivo con el pasado: si la fecha ya pasó devuelve "Empieza hoy" en vez
 * de un negativo ("En -3 días"). El filtro de `selectUpcomingAbsences` ya
 * excluye el pasado, así que ese caso no debería llegar aquí — pero si llega,
 * degrada a algo legible en lugar de mostrar una cuenta atrás absurda.
 */
export function daysUntilLabel(startDate: string, today: Date): string {
  const days = Math.round((toDateOnly(startDate).getTime() - today.getTime()) / MS_PER_DAY);
  if (days <= 0) return 'Empieza hoy';
  if (days === 1) return 'Mañana';
  return `En ${days} días`;
}
