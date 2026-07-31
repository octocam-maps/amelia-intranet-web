import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUpdateOnboardingStep } from '../application/useUpdateOnboardingStep';
import type { AdminOnboardingStep } from '../domain/models';
import { OnboardingStepsList } from './OnboardingStepsList';

vi.mock('../application/useUpdateOnboardingStep', () => ({ useUpdateOnboardingStep: vi.fn() }));

const QUIZ_STEP: AdminOnboardingStep = {
  id: 'step-2',
  stepOrder: 2,
  type: 'quiz',
  title: 'Cuestionario',
  config: {},
  isActive: true,
    documents: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUpdateOnboardingStep).mockReturnValue({
    mutate: vi.fn(),
  } as unknown as ReturnType<typeof useUpdateOnboardingStep>);
});

// Este fichero no existía, y por eso el panel del admin se quedó anunciando
// "cuestionario de 1 intento" cuando RF-A9 (migración 034) subió el techo a 2.
// La vista del EMPLEADO sí se actualizó y sí tenía test (`QuizStep.test.tsx`):
// el defecto sobrevivió justo en el sitio hermano sin cobertura, que además es
// el que RRHH lee para explicar la regla.
describe('OnboardingStepsList — el techo de intentos que lee el admin', () => {
  it('anuncia 2 intentos en el paso de cuestionario, no uno', () => {
    render(<OnboardingStepsList steps={[QUIZ_STEP]} isLoading={false} onEdit={vi.fn()} onPreview={vi.fn()} />);

    expect(screen.getByText(/cuestionario de 2 intentos/i)).toBeInTheDocument();
    expect(screen.queryByText(/cuestionario de 1 intento/i)).not.toBeInTheDocument();
  });
});
