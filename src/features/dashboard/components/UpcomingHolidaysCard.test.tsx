import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { UpcomingHoliday } from '../domain/models';
import { UpcomingHolidaysCard } from './UpcomingHolidaysCard';

/**
 * La tarjeta INVENTABA el ámbito del festivo: rotaba
 * Nacional/Autonómico/Local por posición en la lista, así que el mismo festivo
 * cambiaba de ámbito según dónde cayera. El comentario que lo justificaba decía
 * que el backend "todavía no tiene columna de ámbito", y era falso: existe desde
 * la migración 018 y `HolidaysTable` ya la pintaba con el dato real. Lo único
 * que faltaba era que `GET /dashboard/summary` la proyectara.
 */
describe('UpcomingHolidaysCard — el ámbito es un dato, no una rotación', () => {
  it('tres festivos locales muestran tres veces "Local"', () => {
    const holidays: UpcomingHoliday[] = [
      { day: '2026-08-15', name: 'Fiesta A', scope: 'local' },
      { day: '2026-09-09', name: 'Fiesta B', scope: 'local' },
      { day: '2026-10-12', name: 'Fiesta C', scope: 'local' },
    ];

    render(<UpcomingHolidaysCard holidays={holidays} />);

    expect(screen.getAllByText('Local')).toHaveLength(3);
    // Con la rotación por índice, el segundo y el tercero salían como
    // "Autonómico" y "Nacional".
    expect(screen.queryByText('Autonómico')).not.toBeInTheDocument();
    expect(screen.queryByText('Nacional')).not.toBeInTheDocument();
  });

  it('cada ámbito se pinta con su propia etiqueta', () => {
    const holidays: UpcomingHoliday[] = [
      { day: '2026-08-15', name: 'Asunción', scope: 'nacional' },
      { day: '2026-09-11', name: 'Diada', scope: 'autonomico' },
      { day: '2026-12-24', name: 'Cierre de oficina', scope: 'empresa' },
    ];

    render(<UpcomingHolidaysCard holidays={holidays} />);

    expect(screen.getByText('Nacional')).toBeInTheDocument();
    expect(screen.getByText('Autonómico')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
  });

  it('sin ámbito no se inventa ninguno', () => {
    // `scope` es NULLable: un festivo dado de alta a mano puede no tenerlo.
    // Rellenarlo es exactamente el defecto que se está corrigiendo.
    render(<UpcomingHolidaysCard holidays={[{ day: '2026-08-15', name: 'Sin ámbito', scope: null }]} />);

    expect(screen.getByText('Sin ámbito')).toBeInTheDocument();
    for (const etiqueta of ['Nacional', 'Autonómico', 'Local', 'Empresa']) {
      expect(screen.queryByText(etiqueta)).not.toBeInTheDocument();
    }
  });
});
