import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStore } from '@/store';
import type { UserRole } from '@/features/auth/domain/models';
import { useMyOnboarding } from '../application/useMyOnboarding';
import type { OnboardingStep } from '../domain/models';
import { OnboardingPage } from './OnboardingPage';

vi.mock('../application/useMyOnboarding', () => ({ useMyOnboarding: vi.fn() }));

// Los cinco paneles montan sus propios hooks de mutación y peticiones; aquí se
// prueba el MARCO de la pantalla (cabecera, aviso, riel), no su contenido.
vi.mock('../components/VideoStep', () => ({ VideoStep: () => <div>panel de vídeo</div> }));
vi.mock('../components/QuizStep', () => ({ QuizStep: () => <div>panel de cuestionario</div> }));
vi.mock('../components/ManualStep', () => ({ ManualStep: () => <div>panel de manuales</div> }));
vi.mock('../components/ProfileStep', () => ({ ProfileStep: () => <div>panel de perfil</div> }));
vi.mock('../components/SignedDocumentUploadStep', () => ({
  SignedDocumentUploadStep: () => <div>panel de documentación</div>,
}));

function step(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    id: 'step-1',
    stepOrder: 1,
    type: 'video',
    title: 'Vídeo de bienvenida',
    status: 'available',
    progressPct: 0,
    config: null,
    data: null,
    startedAt: null,
    completedAt: null,
    documents: [],
    ...overrides,
  };
}

/** El orden vigente desde la reordenación de v1.1 (migración 033). */
const FIVE_STEPS: OnboardingStep[] = [
  step({ id: 's1', stepOrder: 1, type: 'video', title: 'Vídeo', status: 'available' }),
  step({ id: 's2', stepOrder: 2, type: 'quiz', title: 'Cuestionario', status: 'locked' }),
  step({ id: 's3', stepOrder: 3, type: 'manual', title: 'Manuales', status: 'locked' }),
  step({ id: 's4', stepOrder: 4, type: 'profile', title: 'Perfil', status: 'locked' }),
  step({ id: 's5', stepOrder: 5, type: 'signature', title: 'Documentación', status: 'locked' }),
];

function mockSteps(steps: OnboardingStep[]) {
  vi.mocked(useMyOnboarding).mockReturnValue({
    data: steps,
    isLoading: false,
  } as unknown as ReturnType<typeof useMyOnboarding>);
}

function setRole(role: UserRole) {
  useStore.setState({
    user: {
      id: 'u1',
      fullName: 'Beatriz Luna',
      email: 'people@ameliahub.com',
      role,
    },
  } as never);
}

function renderPage() {
  return render(
    <MemoryRouter>
      <OnboardingPage />
    </MemoryRouter>
  );
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSteps(FIVE_STEPS);
  });

  describe('como trabajador', () => {
    beforeEach(() => setRole('empleado'));

    it('da la bienvenida y muestra la barra de progreso', () => {
      renderPage();

      expect(screen.getByText(/te damos la bienvenida a amelia, beatriz/i)).toBeInTheDocument();
      expect(screen.getByText('0 de 5 pasos completados')).toBeInTheDocument();
    });

    it('no le dice que puede saltarse el orden', () => {
      renderPage();

      expect(screen.queryByText(/no tienes que completarlo/i)).not.toBeInTheDocument();
    });

    it('los pasos bloqueados no se pueden abrir', () => {
      // El bloqueo secuencial es una regla no negociable del requerimiento: el
      // riel lo refleja, y el backend lo vuelve a validar en cada POST.
      renderPage();

      const cuestionario = screen.getByRole('button', { name: /paso 2 .* bloqueado/i });
      expect(cuestionario).toBeDisabled();
    });
  });

  describe('como administrador', () => {
    beforeEach(() => setRole('administrador'));

    it('habla de revisión, no de bienvenida', () => {
      renderPage();

      expect(screen.getByText('Los pasos del onboarding')).toBeInTheDocument();
      expect(screen.queryByText(/te damos la bienvenida/i)).not.toBeInTheDocument();
    });

    it('dice explícitamente que no tiene que completarlo', () => {
      renderPage();

      expect(screen.getByText(/no tienes que completarlo/i)).toBeInTheDocument();
    });

    it('la aclaración vive en el encabezado, no en un recuadro de aviso aparte', () => {
      // Fija la ESTRUCTURA, no el estilo. La primera versión metía una tarjeta
      // con borde de color y fondo teñido para decir una frase: medio pantallazo
      // de peso visual, y un patrón de aviso que no usa ninguna otra pantalla de
      // la intranet. Si alguien lo reintroduce como bloque suelto, esto falla.
      renderPage();

      const heading = screen.getByRole('heading', { name: 'Los pasos del onboarding' });
      const note = screen.getByText(/no tienes que completarlo/i);

      expect(heading.parentElement).toContainElement(note);
    });

    it('no le muestra una barra de progreso que no tiene que subir', () => {
      renderPage();

      expect(screen.queryByText('0 de 5 pasos completados')).not.toBeInTheDocument();
    });

    it('remite a la previsualización que no registra progreso', () => {
      renderPage();

      expect(screen.getByRole('link', { name: /administración . onboarding/i })).toHaveAttribute(
        'href',
        '/administracion/onboarding'
      );
    });

    it('sigue viendo el riel cuando ya completó los cinco pasos', () => {
      // El hero de "¡Onboarding completado!" SUSTITUYE al riel. Para el admin
      // sería una pantalla sin salida: perdería el acceso a revisar los pasos,
      // que es justo para lo que entra aquí.
      mockSteps(FIVE_STEPS.map((s) => ({ ...s, status: 'completed' as const })));
      renderPage();

      expect(screen.queryByText(/onboarding completado/i)).not.toBeInTheDocument();
      expect(screen.getByText('Los pasos del onboarding')).toBeInTheDocument();
    });
  });

  it('el trabajador que termina sí ve el hero de completado', () => {
    // Regresión de la excepción de arriba: no debe haberse llevado por delante
    // la recompensa de quien de verdad recorrió el onboarding.
    setRole('empleado');
    mockSteps(FIVE_STEPS.map((s) => ({ ...s, status: 'completed' as const })));
    renderPage();

    expect(screen.getByText(/onboarding completado/i)).toBeInTheDocument();
  });
});
