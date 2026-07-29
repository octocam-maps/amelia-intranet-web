import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAcknowledgeManual } from '../application/useAcknowledgeManual';
import type { OnboardingStep } from '../domain/models';
import { ManualStep } from './ManualStep';

vi.mock('../application/useAcknowledgeManual', () => ({ useAcknowledgeManual: vi.fn() }));

const MANUAL_URL = '/manuales/manual-usuario-hincator-2026-ES.pdf';

function buildStep(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    // Paso 3 desde la reordenación de v1.1 — antes era el 4.
    id: 'step-3',
    stepOrder: 3,
    type: 'manual',
    title: 'Manuales',
    config: {},
    status: 'available',
    progressPct: 0,
    data: null,
    startedAt: null,
    completedAt: null,
    document: {
      id: 'doc-manual',
      kind: 'manual',
      title: 'Manual de usuario Hincator® 2026',
      version: 1,
      url: MANUAL_URL,
    },
    ...overrides,
  };
}

function mockHook({ isPending = false } = {}) {
  const mutate = vi.fn();
  vi.mocked(useAcknowledgeManual).mockReturnValue({
    mutate,
    isPending,
    error: null,
  } as unknown as ReturnType<typeof useAcknowledgeManual>);
  return mutate;
}

describe('ManualStep', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ofrece el manual real para leer y descargar, con la URL que manda el backend', () => {
    // La ruta NO se hardcodea en el front: sale de
    // `onboarding_documents.storage_ref` vía `step.document.url`, así que
    // publicar otra versión es cambiar una fila.
    mockHook();
    render(<ManualStep step={buildStep()} />);

    expect(screen.getByText('Manual de usuario Hincator® 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /leer el manual/i })).toHaveAttribute(
      'href',
      MANUAL_URL
    );
    expect(screen.getByRole('link', { name: /descargar pdf/i })).toHaveAttribute('download');
  });

  it('ya no muestra el texto de relleno sobre ClickUp', () => {
    // Ese contenido no tenía nada que ver con el manual del paso: pedía
    // confirmar la lectura de algo que no era el documento del onboarding.
    mockHook();
    render(<ManualStep step={buildStep()} />);

    expect(screen.queryByText(/clickup/i)).not.toBeInTheDocument();
  });

  it('sin manual publicado no deja confirmar la lectura', () => {
    // `storage_ref` a NULL = no hay nada que leer. Pedir que confirme la
    // lectura de un documento inexistente es lo que hacía antes.
    mockHook();
    render(<ManualStep step={buildStep({ document: null })} />);

    expect(screen.getByText(/todavía no ha publicado este manual/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /he leído y confirmo/i })).toBeDisabled();
  });

  it('confirma la lectura llamando a mutate con el id del paso', () => {
    const mutate = mockHook();
    const step = buildStep();
    render(<ManualStep step={step} />);

    screen.getByRole('button', { name: /he leído y confirmo/i }).click();

    expect(mutate).toHaveBeenCalledWith(step.id);
  });

  it('una vez confirmada, muestra el estado y no repite el botón', () => {
    mockHook();
    render(<ManualStep step={buildStep({ status: 'completed' })} />);

    expect(screen.getByText(/lectura confirmada/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /he leído y confirmo/i })).not.toBeInTheDocument();
    // Sigue pudiendo consultarlo después.
    expect(screen.getByRole('link', { name: /leer el manual/i })).toBeInTheDocument();
  });

  it('bloqueado: el mensaje habla de los manuales en plural', () => {
    mockHook();
    render(<ManualStep step={buildStep({ status: 'locked' })} />);

    expect(screen.getByText(/desbloquear los manuales/i)).toBeInTheDocument();
  });
});
