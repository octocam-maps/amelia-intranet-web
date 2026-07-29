import type { HolidayScope } from './models';

/**
 * Presentación del ámbito de un festivo, en un único sitio.
 *
 * Vivía dentro de `HolidaysTable.tsx`, y por eso la tarjeta "Próximos festivos"
 * del Inicio no lo reutilizó: en vez de importarlo se **inventó** el ámbito
 * rotando Nacional/Autonómico/Local por posición en la lista. Con los
 * diccionarios aquí, el segundo consumidor no tiene excusa para divergir.
 *
 * El `variant` de Badge es presentación y no dominio puro, pero se guarda junto
 * a la etiqueta a propósito: separarlos es justo lo que permite que una vista
 * pinte "Local" en naranja y otra en verde.
 *
 * deck-fase6/14-festivos.png § leyenda — nacional en navy sólido, autonómico en
 * verde, local en naranja, empresa en azul.
 */
export const SCOPE_LABEL: Record<HolidayScope, string> = {
  nacional: 'Nacional',
  autonomico: 'Autonómico',
  local: 'Local',
  empresa: 'Empresa',
};

export const SCOPE_BADGE_VARIANT: Record<HolidayScope, 'dark' | 'success' | 'warning' | 'info'> = {
  nacional: 'dark',
  autonomico: 'success',
  local: 'warning',
  empresa: 'info',
};
