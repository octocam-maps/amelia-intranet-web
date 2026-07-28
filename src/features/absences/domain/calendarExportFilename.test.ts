import { describe, expect, it } from 'vitest';
import { buildCalendarExportFilename } from './calendarExportFilename';

describe('buildCalendarExportFilename', () => {
  it('sin subjectName mantiene el nombre del export global (sin cambios)', () => {
    const filename = buildCalendarExportFilename({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      extension: 'xlsx',
    });

    expect(filename).toBe('calendario-ausencias-2026-07-01_2026-07-31.xlsx');
  });

  it('con subjectName incluye el slug del nombre del empleado', () => {
    const filename = buildCalendarExportFilename({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      extension: 'xlsx',
      subjectName: 'Ana García',
    });

    expect(filename).toBe('calendario-ausencias-ana-garcia-2026-07-01_2026-07-31.xlsx');
  });

  it('el slug quita tildes, pasa a minúsculas y reemplaza espacios por guiones', () => {
    const filename = buildCalendarExportFilename({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      extension: 'pdf',
      subjectName: '  José Ángel Núñez  ',
    });

    expect(filename).toBe('calendario-ausencias-jose-angel-nunez-2026-07-01_2026-07-31.pdf');
  });
});
