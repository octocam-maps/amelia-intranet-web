import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAcknowledgeManual } from '../application/useAcknowledgeManual';
import type { OnboardingStep, OnboardingStepDocument } from '../domain/models';
import { ManualStep } from './ManualStep';

vi.mock('../application/useAcknowledgeManual', () => ({ useAcknowledgeManual: vi.fn() }));

const CLICKUP_URL = '/manuales/manual-clickup-2026-ES.pdf';
const HINCATOR_URL = '/manuales/manual-usuario-hincator-2026-ES.pdf';

function buildDocument(overrides: Partial<OnboardingStepDocument> = {}): OnboardingStepDocument {
  return {
    id: 'doc-manual',
    kind: 'manual',
    title: 'Manual de usuario Hincator® 2026',
    version: 1,
    url: HINCATOR_URL,
    displayOrder: 2,
    acknowledged: false,
    locked: false,
    ...overrides,
  };
}

/** Abre la cascada (migración backend 040): es la puerta del paso 3. */
const CLICKUP = buildDocument({
  id: 'doc-manual-clickup',
  title: 'Manual de uso de ClickUp',
  url: CLICKUP_URL,
  displayOrder: 1,
});

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
    documents: [buildDocument()],
    ...overrides,
  };
}

function mockHook({ isPending = false, variables = undefined } = {}) {
  const mutate = vi.fn();
  vi.mocked(useAcknowledgeManual).mockReturnValue({
    mutate,
    isPending,
    variables,
    error: null,
  } as unknown as ReturnType<typeof useAcknowledgeManual>);
  return mutate;
}

describe('ManualStep — un solo manual', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ofrece el manual real para leer y descargar, con la URL que manda el backend', () => {
    // La ruta NO se hardcodea en el front: sale de
    // `onboarding_documents.storage_ref`, así que publicar otra versión es
    // cambiar una fila.
    mockHook();
    render(<ManualStep step={buildStep()} />);

    expect(screen.getByText('Manual de usuario Hincator® 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /leer el manual/i })).toHaveAttribute(
      'href',
      HINCATOR_URL
    );
    expect(screen.getByRole('link', { name: /descargar pdf/i })).toHaveAttribute('download');
  });

  it('con un solo manual no muestra el contador de progreso', () => {
    // «1 de 1 confirmados» es ruido: el contador solo aporta con cascada.
    mockHook();
    render(<ManualStep step={buildStep()} />);

    expect(screen.queryByText(/manuales confirmados/i)).not.toBeInTheDocument();
  });

  it('confirma la lectura mandando el paso Y el manual concreto', () => {
    // `documentId` es obligatorio desde la 040: "el manual" ya no identifica
    // nada cuando el paso admite varios.
    const mutate = mockHook();
    const step = buildStep();
    render(<ManualStep step={step} />);

    screen.getByRole('button', { name: /he leído y confirmo/i }).click();

    expect(mutate).toHaveBeenCalledWith({ stepId: step.id, documentId: 'doc-manual' });
  });

  it('sin manuales configurados no ofrece confirmar nada', () => {
    mockHook();
    render(<ManualStep step={buildStep({ documents: [] })} />);

    expect(screen.getByText(/todavía no ha publicado los manuales/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /he leído y confirmo/i })).not.toBeInTheDocument();
  });

  it('con el manual sin publicar (url null) no deja confirmar', () => {
    // `storage_ref` a NULL = no hay nada que leer. Pedir que confirme la lectura
    // de un documento inexistente es lo que hacía antes.
    mockHook();
    render(<ManualStep step={buildStep({ documents: [buildDocument({ url: null })] })} />);

    expect(screen.getByText(/todavía no ha publicado este manual/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /he leído y confirmo/i })).not.toBeInTheDocument();
  });

  it('bloqueado por el paso anterior: el mensaje habla de los manuales en plural', () => {
    mockHook();
    render(<ManualStep step={buildStep({ status: 'locked' })} />);

    expect(screen.getByText(/desbloquear los manuales/i)).toBeInTheDocument();
  });
});

describe('ManualStep — cascada de manuales (migración 040)', () => {
  beforeEach(() => vi.clearAllMocks());

  const bothPending = buildStep({
    documents: [CLICKUP, buildDocument({ locked: true })],
  });

  it('el primero de la cascada se puede confirmar y el segundo sale con candado', () => {
    mockHook();
    render(<ManualStep step={bothPending} />);

    // Solo un botón de confirmación: el del manual abierto.
    expect(screen.getAllByRole('button', { name: /he leído y confirmo/i })).toHaveLength(1);
    expect(screen.getByText(/se desbloquea al confirmar el manual anterior/i)).toBeInTheDocument();
  });

  it('el manual bloqueado NO ofrece enlaces para leerlo', () => {
    // Si se pudiera abrir igualmente, el candado estorbaría sin proteger nada.
    mockHook();
    render(<ManualStep step={bothPending} />);

    expect(screen.getAllByRole('link', { name: /leer el manual/i })).toHaveLength(1);
    expect(screen.getByRole('link', { name: /leer el manual/i })).toHaveAttribute(
      'href',
      CLICKUP_URL
    );
  });

  it('explica POR QUÉ el resto está bloqueado, nombrando el manual que toca', () => {
    mockHook();
    render(<ManualStep step={bothPending} />);

    expect(
      screen.getByText(/Lee «Manual de uso de ClickUp» para desbloquear el resto/i)
    ).toBeInTheDocument();
  });

  it('cuenta el progreso cuando hay más de un manual', () => {
    mockHook();
    render(<ManualStep step={bothPending} />);

    expect(screen.getByText('0 de 2 manuales confirmados')).toBeInTheDocument();
  });

  it('confirmar el primero desbloquea el segundo y actualiza el contador', () => {
    mockHook();
    render(
      <ManualStep
        step={buildStep({
          documents: [{ ...CLICKUP, acknowledged: true }, buildDocument({ locked: false })],
        })}
      />
    );

    expect(screen.getByText('1 de 2 manuales confirmados')).toBeInTheDocument();
    expect(screen.getByText('Confirmado')).toBeInTheDocument();
    // Ya no queda nada bloqueado, así que el mensaje de la puerta desaparece.
    expect(screen.queryByText(/para desbloquear el resto/i)).not.toBeInTheDocument();
    // Y el botón que queda es el del segundo manual.
    expect(screen.getAllByRole('button', { name: /he leído y confirmo/i })).toHaveLength(1);
  });

  it('el paso completo declara que están TODOS confirmados', () => {
    // RF-A6.3: el paso no se cierra con el primero. El copy no debe decir
    // "lectura confirmada" en singular cuando eran varios.
    mockHook();
    render(
      <ManualStep
        step={buildStep({
          status: 'completed',
          documents: [
            { ...CLICKUP, acknowledged: true },
            buildDocument({ acknowledged: true }),
          ],
        })}
      />
    );

    expect(screen.getByText(/lectura de todos los manuales confirmada/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /he leído y confirmo/i })).not.toBeInTheDocument();
    // Siguen consultables después.
    expect(screen.getAllByRole('link', { name: /leer el manual/i })).toHaveLength(2);
  });

  it('solo marca como "Confirmando…" el manual que se está enviando', () => {
    mockHook({ isPending: true, variables: { stepId: 'step-3', documentId: CLICKUP.id } });
    render(<ManualStep step={buildStep({ documents: [CLICKUP, buildDocument()] })} />);

    expect(screen.getByRole('button', { name: /confirmando…/i })).toBeInTheDocument();
    // El otro manual conserva su botón normal: no se queda todo el paso en vilo.
    expect(screen.getByRole('button', { name: /he leído y confirmo/i })).toBeInTheDocument();
  });
});
