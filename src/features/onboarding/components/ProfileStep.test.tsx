import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDepartments } from '@/features/departments/application/useDepartments';
import { useCompleteProfile } from '../application/useCompleteProfile';
import type { OnboardingStep } from '../domain/models';
import { ProfileStep } from './ProfileStep';

vi.mock('../application/useCompleteProfile', () => ({ useCompleteProfile: vi.fn() }));
vi.mock('@/features/departments/application/useDepartments', () => ({ useDepartments: vi.fn() }));

function buildStep(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    // Paso 4 desde la reordenación de v1.1 — era el 5 y el último.
    id: 'step-4',
    stepOrder: 4,
    type: 'profile',
    title: 'Completa tu perfil',
    config: {},
    status: 'available',
    progressPct: 0,
    data: null,
    startedAt: null,
    completedAt: null,
    document: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCompleteProfile).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCompleteProfile>);
  vi.mocked(useDepartments).mockReturnValue({
    data: [{ id: 'dept-1', name: 'Operaciones' }],
    isLoading: false,
  } as unknown as ReturnType<typeof useDepartments>);
});

// Este fichero no existía, y por eso nadie vio que el copy quedó caducado con
// la reordenación del onboarding (migración 033): el perfil pasó de ser el 5º
// y último al 4º, con la documentación firmada detrás.
describe('ProfileStep — el perfil YA NO es el último paso', () => {
  it('no se anuncia como último paso', () => {
    render(<ProfileStep step={buildStep()} />);

    // Ojo con la trampa: "Penúltimo paso" CONTIENE "último paso", así que un
    // `/último paso/i` a secas da un falso positivo. Hay que anclar al inicio
    // del texto del propio subtítulo.
    const subtitulo = screen.getByText(/paso\. Todos los campos/i);

    expect(subtitulo.textContent).toMatch(/^Penúltimo paso\./);
    expect(subtitulo.textContent).not.toMatch(/^Último paso/);
  });

  it('el botón no promete finalizar el onboarding', () => {
    // Enviar este formulario NO cierra el onboarding: desbloquea el paso 5.
    render(<ProfileStep step={buildStep()} />);

    expect(screen.queryByRole('button', { name: /finalizar onboarding/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar perfil/i })).toBeInTheDocument();
  });

  it('al completarlo remite al paso que queda, no da el onboarding por hecho', () => {
    render(<ProfileStep step={buildStep({ status: 'completed' })} />);

    expect(screen.getByText(/perfil completado/i)).toBeInTheDocument();
    expect(screen.getByText(/documentación firmada/i)).toBeInTheDocument();
    // "Ya formas parte del equipo" daba el flujo por terminado.
    expect(screen.queryByText(/ya formas parte del equipo/i)).not.toBeInTheDocument();
  });
});
