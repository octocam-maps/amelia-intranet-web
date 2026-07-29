import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCreateTimeClockEntriesBatch } from '../application/useCreateTimeClockEntriesBatch';
import type { TimeClockEntriesBatchResult } from '../domain/models';
import { BatchTimeClockEntryForm } from './BatchTimeClockEntryForm';

vi.mock('../application/useCreateTimeClockEntriesBatch', () => ({
  useCreateTimeClockEntriesBatch: vi.fn(),
}));

function mockHook(overrides: Partial<ReturnType<typeof useCreateTimeClockEntriesBatch>> = {}) {
  vi.mocked(useCreateTimeClockEntriesBatch).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
    ...overrides,
  } as ReturnType<typeof useCreateTimeClockEntriesBatch>);
}

function fillRange(dateFrom: string, dateTo: string) {
  fireEvent.change(screen.getByLabelText(/desde/i), { target: { value: dateFrom } });
  fireEvent.change(screen.getByLabelText(/hasta/i), { target: { value: dateTo } });
}

describe('BatchTimeClockEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra un error de validación cuando el rango supera 7 días, sin llamar a la API', async () => {
    const mutateAsync = vi.fn();
    mockHook({ mutateAsync });
    render(<BatchTimeClockEntryForm />);

    fillRange('2026-07-13', '2026-07-21');
    fireEvent.click(screen.getByRole('button', { name: /fichar rango/i }));

    expect(await screen.findByText(/no puede abarcar más de 7 días/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('muestra un error de validación cuando el rango incluye un día laborable futuro, sin llamar a la API', async () => {
    const mutateAsync = vi.fn();
    mockHook({ mutateAsync });
    render(<BatchTimeClockEntryForm />);

    // "Hoy" es real (Date.now()), así que se usa un rango claramente futuro
    // respecto a cualquier fecha de ejecución del test (año 2099).
    fillRange('2099-01-05', '2099-01-06'); // lunes-martes, laborables futuros

    fireEvent.click(screen.getByRole('button', { name: /fichar rango/i }));

    expect(await screen.findByText(/día laborable futuro/i)).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('llama a la API con el payload correcto para un rango pasado válido', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ created: [], omitted: [] });
    mockHook({ mutateAsync });
    render(<BatchTimeClockEntryForm />);

    fillRange('2020-01-06', '2020-01-08'); // lunes-miércoles, claramente pasado
    fireEvent.click(screen.getByRole('button', { name: /fichar rango/i }));

    await screen.findByText(/0 día/i);

    expect(mutateAsync).toHaveBeenCalledWith({
      dateFrom: '2020-01-06',
      dateTo: '2020-01-08',
      clockInTime: '08:00',
      clockOutTime: '17:00',
    });
  });

  it('muestra el desglose de creados y omitidos con motivos en español legible', async () => {
    const result: TimeClockEntriesBatchResult = {
      created: [
        {
          id: 'entry-1',
          userId: 'user-1',
          fullName: null,
          workDate: '2020-01-06',
          clockIn: '2020-01-06T08:00:00Z',
          clockOut: '2020-01-06T17:00:00Z',
          source: 'web',
          workedMinutes: 540,
        },
      ],
      omitted: [
        { workDate: '2020-01-11', reason: 'fin_de_semana' },
        { workDate: '2020-01-12', reason: 'fin_de_semana' },
        { workDate: '2020-01-13', reason: 'festivo' },
        { workDate: '2020-01-14', reason: 'ausencia' },
        { workDate: '2020-01-15', reason: 'ya_registrado' },
        { workDate: '2020-01-16', reason: 'fuera_de_ventana' },
      ],
    };
    const mutateAsync = vi.fn().mockResolvedValue(result);
    mockHook({ mutateAsync });
    render(<BatchTimeClockEntryForm />);

    fillRange('2020-01-06', '2020-01-12'); // 7 días, dentro del tope del cliente
    fireEvent.click(screen.getByRole('button', { name: /fichar rango/i }));

    expect(await screen.findByText(/1 día/i)).toBeInTheDocument();
    expect(screen.getByText('2020-01-11: fin de semana')).toBeInTheDocument();
    expect(screen.getByText('2020-01-13: festivo')).toBeInTheDocument();
    expect(screen.getByText('2020-01-14: ausencia aprobada')).toBeInTheDocument();
    expect(screen.getByText('2020-01-15: ya registrado')).toBeInTheDocument();
    expect(screen.getByText('2020-01-16: fuera de plazo')).toBeInTheDocument();
    expect(screen.queryByText(/fuera_de_ventana/)).not.toBeInTheDocument();
  });

  it('muestra el error del backend cuando la mutación falla', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('El lote incluye un día futuro.'));
    mockHook({ mutateAsync, error: new Error('El lote incluye un día futuro.') });
    render(<BatchTimeClockEntryForm />);

    fillRange('2020-01-06', '2020-01-08');
    fireEvent.click(screen.getByRole('button', { name: /fichar rango/i }));

    expect(await screen.findByText(/el lote incluye un día futuro/i)).toBeInTheDocument();
  });
});
