import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubmitQuiz } from '../application/useSubmitQuiz';
import type { OnboardingStep, QuizResult } from '../domain/models';
import { QuizStep } from './QuizStep';

vi.mock('../application/useSubmitQuiz', () => ({ useSubmitQuiz: vi.fn() }));

const QUESTIONS = [
  { id: 'q1', text: '¿Cuántos parámetros críticos captura el Hincator?', options: ['5', '7'] },
  { id: 'q2', text: '¿En cuánto tiempo los captura?', options: ['15 segundos', '5 segundos'] },
  { id: 'q3', text: '¿Cuántas hincas por hora?', options: ['Hasta 50', 'Hasta 100'] },
];

function buildStep(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    id: 'step-2',
    stepOrder: 2,
    type: 'quiz',
    title: 'Cuestionario: El Hincator',
    config: { questions: QUESTIONS, threshold: 0.7 },
    status: 'available',
    progressPct: 0,
    data: null,
    startedAt: null,
    completedAt: null,
    document: null,
    ...overrides,
  };
}

function buildResult(overrides: Partial<QuizResult> = {}): QuizResult {
  return {
    stepId: 'step-2',
    score: 33.33,
    passed: false,
    submittedAt: '2026-07-29T10:00:00Z',
    incorrectQuestionIds: ['q2', 'q3'],
    attemptsUsed: 1,
    attemptsLeft: 1,
    ...overrides,
  };
}

/** `mutate` que resuelve con `result`, imitando el `onSuccess` de la mutation. */
function mockHook(result: QuizResult | null = null) {
  const mutate = vi.fn((_vars, opts) => {
    if (result) opts?.onSuccess?.(result);
  });
  vi.mocked(useSubmitQuiz).mockReturnValue({
    mutate,
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useSubmitQuiz>);
  return mutate;
}

function answerAll() {
  for (const question of QUESTIONS) {
    fireEvent.click(screen.getByRole('radio', { name: question.options[0] }));
  }
}

describe('QuizStep', () => {
  beforeEach(() => vi.clearAllMocks());

  it('anuncia 2 intentos, no uno', () => {
    mockHook();
    render(<QuizStep step={buildStep()} />);

    expect(screen.getByText(/tienes 2 intentos/i)).toBeInTheDocument();
    expect(screen.queryByText(/solo tienes un intento/i)).not.toBeInTheDocument();
  });

  it('tras fallar muestra QUÉ preguntas falló, con su enunciado', () => {
    mockHook(buildResult());
    render(<QuizStep step={buildStep()} />);
    answerAll();
    fireEvent.click(screen.getByRole('button', { name: /enviar cuestionario/i }));

    expect(screen.getByText(/preguntas que has fallado/i)).toBeInTheDocument();

    // Se comprueba la LISTA, no el documento entero: los enunciados también
    // están en el formulario, que sigue en pantalla para el segundo intento
    // (y ahí van prefijados con su número, "1. ¿Cuántos…").
    const falladas = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(falladas).toEqual(['¿En cuánto tiempo los captura?', '¿Cuántas hincas por hora?']);
    // La acertada no está entre las falladas.
    expect(falladas).not.toContain('¿Cuántos parámetros críticos captura el Hincator?');
  });

  it('NUNCA muestra la respuesta correcta de una pregunta fallada', () => {
    // El backend solo manda ids; el enunciado sale de `config`, que ya llega
    // con `correct` enmascarado. Este test es la guarda de que la UI no
    // introduce por su cuenta un "la respuesta era X".
    mockHook(buildResult());
    render(<QuizStep step={buildStep()} />);
    answerAll();
    fireEvent.click(screen.getByRole('button', { name: /enviar cuestionario/i }));

    expect(screen.queryByText(/respuesta correcta/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/la correcta era/i)).not.toBeInTheDocument();
  });

  it('con un intento restante deja reintentar, y dice cuántos quedan', () => {
    mockHook(buildResult({ attemptsLeft: 1 }));
    render(<QuizStep step={buildStep()} />);
    answerAll();
    fireEvent.click(screen.getByRole('button', { name: /enviar cuestionario/i }));

    expect(screen.getByText(/te queda/i)).toBeInTheDocument();
    expect(screen.getByText('1 intento')).toBeInTheDocument();
    // El formulario sigue en pantalla: se puede volver a enviar.
    expect(screen.getByRole('button', { name: /enviar cuestionario/i })).toBeInTheDocument();
  });

  it('al empezar de nuevo limpia las respuestas del intento anterior', () => {
    // Reaprovecharlas invitaría a cambiar solo la fallada sin releer el resto.
    mockHook(buildResult({ attemptsLeft: 1 }));
    render(<QuizStep step={buildStep()} />);
    answerAll();
    fireEvent.click(screen.getByRole('button', { name: /enviar cuestionario/i }));

    fireEvent.click(screen.getByRole('button', { name: /empezar de nuevo/i }));

    expect(screen.getByRole('button', { name: /enviar cuestionario/i })).toBeDisabled();
    for (const question of QUESTIONS) {
      expect(screen.getByRole('radio', { name: question.options[0] })).not.toBeChecked();
    }
  });

  it('sin intentos restantes NO ofrece reintentar y remite a RRHH', () => {
    mockHook(buildResult({ attemptsLeft: 0 }));
    render(<QuizStep step={buildStep()} />);
    answerAll();
    fireEvent.click(screen.getByRole('button', { name: /enviar cuestionario/i }));

    expect(screen.queryByRole('button', { name: /enviar cuestionario/i })).not.toBeInTheDocument();
    expect(screen.getByText(/agotado tus dos intentos/i)).toBeInTheDocument();
    expect(screen.getByText(/habla con rrhh/i)).toBeInTheDocument();
    // Aun agotados los intentos, sigue viendo qué falló.
    expect(screen.getByText(/preguntas que has fallado/i)).toBeInTheDocument();
  });

  it('al aprobar cierra el paso sin ofrecer reintento', () => {
    mockHook(buildResult({ passed: true, score: 100, incorrectQuestionIds: [], attemptsLeft: 0 }));
    render(<QuizStep step={buildStep()} />);
    answerAll();
    fireEvent.click(screen.getByRole('button', { name: /enviar cuestionario/i }));

    expect(screen.getByText(/cuestionario superado/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /enviar cuestionario/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/has fallado/i)).not.toBeInTheDocument();
  });

  it('aprobado con un fallo: enseña cuál falló igualmente', () => {
    // Con umbral del 70% se aprueba fallando una de tres. Saber cuál es útil y
    // no tiene contrapartida: el paso ya está cerrado.
    mockHook(buildResult({ passed: true, score: 66.67, incorrectQuestionIds: ['q3'], attemptsLeft: 0 }));
    render(<QuizStep step={buildStep()} />);
    answerAll();
    fireEvent.click(screen.getByRole('button', { name: /enviar cuestionario/i }));

    expect(screen.getByText(/cuestionario superado/i)).toBeInTheDocument();
    expect(screen.getByText(/pregunta que has fallado/i)).toBeInTheDocument();
    expect(screen.getByText('¿Cuántas hincas por hora?')).toBeInTheDocument();
  });

  it('tras recargar muestra la nota guardada en step.data', () => {
    mockHook();
    render(
      <QuizStep step={buildStep({ status: 'completed', data: { score: 75, passed: true } })} />
    );

    expect(screen.getByText(/cuestionario superado/i)).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });
});
