import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AbsenceBalance, AbsenceType } from '../domain/models';
import { AbsenceRequestForm } from './AbsenceRequestForm';

const useAbsenceTypes = vi.hoisted(() => vi.fn());
const useAbsenceBalance = vi.hoisted(() => vi.fn());
vi.mock('../application/useAbsenceTypes', () => ({ useAbsenceTypes }));
vi.mock('../application/useAbsenceBalance', () => ({ useAbsenceBalance }));
vi.mock('../application/useCreateAbsenceRequest', () => ({
  useCreateAbsenceRequest: () => ({ mutateAsync: vi.fn(), error: null }),
}));

function type(overrides: Partial<AbsenceType> = {}): AbsenceType {
  return {
    id: 't-vac',
    code: 'vacaciones',
    name: 'Vacaciones',
    isPaid: true,
    affectsBalance: true,
    color: '#F59F0A',
    requiresApproval: true,
    requiresJustification: false,
    maxDaysPerYear: null,
    ...overrides,
  } as AbsenceType;
}

function balance(overrides: Partial<AbsenceBalance> = {}): AbsenceBalance {
  return {
    absenceTypeId: 't-vac',
    absenceTypeName: 'Vacaciones',
    year: 2026,
    entitledDays: 23,
    usedDays: 23,
    pendingDays: 0,
    availableDays: 0,
    ...overrides,
  } as AbsenceBalance;
}

/** Selecciona el tipo por su nombre y pide un rango de 4 días laborables. */
function requestFourDays(typeName: string) {
  fireEvent.click(screen.getByText(typeName));
  fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-08-03' } });
  fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-08-06' } });
}

describe('AbsenceRequestForm — previsualización de saldo', () => {
  it('NO muestra un saldo negativo: avisa de que no hay días suficientes', () => {
    // Saldo agotado (0 disponibles) y se piden 4 días: el backend rechazará la
    // solicitud con InsufficientBalanceError, así que la UI debe avisar en vez
    // de mostrar "te quedarían -4 disponibles".
    useAbsenceTypes.mockReturnValue({ data: [type()] });
    useAbsenceBalance.mockReturnValue({ data: [balance({ availableDays: 0 })] });

    render(<AbsenceRequestForm />);
    requestFourDays('Vacaciones');

    expect(screen.queryByText(/-4/)).not.toBeInTheDocument();
    expect(screen.getByText(/no te quedan suficientes días/i)).toBeInTheDocument();
  });

  it('no menciona el saldo para un tipo que no descuenta días', () => {
    // `affectsBalance: false` (permiso de matrimonio, remoto, enfermedades…):
    // no consumen ningún contador y el backend ni valida saldo, así que hablar
    // de "días disponibles" aquí no significa nada.
    useAbsenceTypes.mockReturnValue({
      data: [type({ id: 't-mat', code: 'permiso_matrimonio', name: 'Permiso Matrimonio', affectsBalance: false })],
    });
    useAbsenceBalance.mockReturnValue({ data: [balance({ absenceTypeId: 't-mat', availableDays: 0 })] });

    render(<AbsenceRequestForm />);
    requestFourDays('Permiso Matrimonio');

    expect(screen.getByText(/solicitas 4 días/i)).toBeInTheDocument();
    expect(screen.queryByText(/disponibles/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/quedarían/i)).not.toBeInTheDocument();
  });

  it('sí muestra el saldo restante cuando hay días de sobra', () => {
    useAbsenceTypes.mockReturnValue({ data: [type()] });
    useAbsenceBalance.mockReturnValue({ data: [balance({ availableDays: 10 })] });

    render(<AbsenceRequestForm />);
    requestFourDays('Vacaciones');

    expect(screen.getByText(/te quedarían 6 disponibles/i)).toBeInTheDocument();
  });
});
