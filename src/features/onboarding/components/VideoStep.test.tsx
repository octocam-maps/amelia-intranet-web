import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useReportVideoProgress } from '../application/useReportVideoProgress';
import type { OnboardingStep } from '../domain/models';
import { VideoStep } from './VideoStep';

vi.mock('../application/useReportVideoProgress', () => ({ useReportVideoProgress: vi.fn() }));

function buildStep(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    id: 'step-1',
    stepOrder: 1,
    type: 'video',
    title: 'Vídeo de bienvenida',
    config: { duration: 96 },
    status: 'available',
    progressPct: 0,
    data: null,
    startedAt: null,
    completedAt: null,
    ...overrides,
  } as OnboardingStep;
}

/**
 * jsdom no implementa el reproductor: `duration` es NaN y `play()` no existe.
 * Se parchean para que los handlers del componente tengan una base temporal
 * con la que trabajar — lo que se prueba es la POLÍTICA de seek, no el códec.
 */
function stubVideoElement(duration = 96) {
  Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
    configurable: true,
    get: () => duration,
  });
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
}

function getVideo(): HTMLVideoElement {
  const video = document.querySelector('video');
  if (!video) throw new Error('No se ha renderizado el <video>');
  return video;
}

describe('VideoStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stubVideoElement();
    vi.mocked(useReportVideoProgress).mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useReportVideoProgress>);
  });

  describe('paso del trabajador (por defecto)', () => {
    it('no expone los controles nativos, que son la única barra arrastrable', () => {
      render(<VideoStep step={buildStep()} />);

      expect(getVideo()).not.toHaveAttribute('controls');
    });

    it('revierte un seek más allá de lo ya visto', () => {
      render(<VideoStep step={buildStep()} />);
      const video = getVideo();

      // Ve los 10 primeros segundos y luego intenta saltar al 90.
      video.currentTime = 10;
      fireEvent.timeUpdate(video);
      video.currentTime = 90;
      fireEvent.seeking(video);

      expect(video.currentTime).toBe(10);
    });

    it('restaura el ritmo de reproducción si algo lo acelera', () => {
      render(<VideoStep step={buildStep()} />);
      const video = getVideo();

      video.playbackRate = 16;
      fireEvent(video, new Event('ratechange'));

      expect(video.playbackRate).toBe(1);
    });

    it('avisa de que no se puede adelantar', () => {
      render(<VideoStep step={buildStep()} />);

      expect(screen.getByText('No se puede adelantar')).toBeInTheDocument();
    });
  });

  describe('modo revisión del administrador', () => {
    it('devuelve los controles nativos', () => {
      render(<VideoStep step={buildStep()} reviewMode />);

      expect(getVideo()).toHaveAttribute('controls');
    });

    it('NO revierte un seek hacia delante — es justo lo que se pide', () => {
      render(<VideoStep step={buildStep()} reviewMode />);
      const video = getVideo();

      video.currentTime = 10;
      fireEvent.timeUpdate(video);
      video.currentTime = 90;
      fireEvent.seeking(video);

      expect(video.currentTime).toBe(90);
    });

    it('NO revierte un rebobinado', () => {
      render(<VideoStep step={buildStep()} reviewMode />);
      const video = getVideo();

      video.currentTime = 80;
      fireEvent.timeUpdate(video);
      video.currentTime = 5;
      fireEvent.seeking(video);

      expect(video.currentTime).toBe(5);
    });

    it('no afirma que el vídeo no se pueda adelantar, porque sí se puede', () => {
      render(<VideoStep step={buildStep()} reviewMode />);

      expect(screen.queryByText('No se puede adelantar')).not.toBeInTheDocument();
      expect(screen.getByText(/Vista de revisión/)).toBeInTheDocument();
    });

    it('sigue reportando el progreso: el paso es suyo y puede completarlo', () => {
      const mutate = vi.fn();
      vi.mocked(useReportVideoProgress).mockReturnValue({
        mutate,
      } as unknown as ReturnType<typeof useReportVideoProgress>);
      render(<VideoStep step={buildStep()} reviewMode />);
      const video = getVideo();

      video.currentTime = 96;
      fireEvent.timeUpdate(video);
      fireEvent.ended(video);

      expect(mutate).toHaveBeenCalledWith({ stepId: 'step-1', progressPct: 100 });
    });
  });
});
