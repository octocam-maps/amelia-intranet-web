import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AdminOnboardingStep } from '../domain/models';
import { StepPreviewDialog } from './StepPreviewDialog';

function buildStep(overrides: Partial<AdminOnboardingStep> = {}): AdminOnboardingStep {
  return {
    id: 'step-1',
    stepOrder: 1,
    type: 'video',
    title: 'Bienvenida a Amelia',
    config: { url: '/videos/hincator.mp4', duration: 96 },
    isActive: true,
    documents: [],
    ...overrides,
  };
}

function document_(overrides = {}) {
  return {
    id: 'doc-clickup',
    kind: 'manual',
    title: 'Manual de uso de ClickUp',
    version: 1,
    url: '/manuales/manual-clickup-2026-ES.pdf',
    displayOrder: 1,
    acknowledged: false,
    locked: false,
    ...overrides,
  };
}

describe('StepPreviewDialog', () => {
  it('avisa de que no registra progreso propio del admin', () => {
    // Es la garantía que el admin necesita antes de abrir el paso 1: que mirar el
    // vídeo no le cuente como haberlo visto.
    render(<StepPreviewDialog step={buildStep()} onOpenChange={() => {}} />);

    expect(screen.getByText(/no registra ningún progreso/i)).toBeInTheDocument();
  });

  it('no renderiza nada si no hay paso seleccionado', () => {
    render(<StepPreviewDialog step={null} onOpenChange={() => {}} />);

    expect(screen.queryByText(/no registra ningún progreso/i)).not.toBeInTheDocument();
  });

  it('el vídeo se puede adelantar aquí, al contrario que en el paso real', () => {
    // El admin está revisando contenido, no cumpliendo el paso.
    render(<StepPreviewDialog step={buildStep()} onOpenChange={() => {}} />);

    const video = document.querySelector('video');
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('src', '/videos/hincator.mp4');
  });

  it('el cuestionario muestra la respuesta correcta, y explica por qué', () => {
    render(
      <StepPreviewDialog
        step={buildStep({
          stepOrder: 2,
          type: 'quiz',
          title: 'Cuestionario',
          config: {
            threshold: 0.7,
            questions: [
              { id: 'q1', text: '¿Cuántos parámetros?', options: ['5', '7'], correct: '7' },
            ],
          },
        })}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText('¿Cuántos parámetros?')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    // El copy aclara que el trabajador nunca la recibe — si no, parecería una
    // fuga de la respuesta.
    expect(screen.getByText(/El trabajador nunca la recibe/i)).toBeInTheDocument();
  });

  it('los manuales salen en su orden de lectura y explica la cascada', () => {
    render(
      <StepPreviewDialog
        step={buildStep({
          stepOrder: 3,
          type: 'manual',
          title: 'Manuales',
          config: null,
          documents: [
            document_(),
            document_({ id: 'doc-hincator', title: 'Manual Hincator', displayOrder: 2 }),
          ],
        })}
        onOpenChange={() => {}}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Manual de uso de ClickUp');
    expect(items[1]).toHaveTextContent('Manual Hincator');
    expect(screen.getByText(/no se completa hasta tenerlos todos/i)).toBeInTheDocument();
  });

  it('con un solo manual no habla de orden de lectura', () => {
    render(
      <StepPreviewDialog
        step={buildStep({ type: 'manual', config: null, documents: [document_()] })}
        onOpenChange={() => {}}
      />
    );

    expect(screen.queryByText(/Se leen en este orden/i)).not.toBeInTheDocument();
  });

  it('avisa cuando un documento no tiene fichero publicado', () => {
    render(
      <StepPreviewDialog
        step={buildStep({
          type: 'manual',
          config: null,
          documents: [document_({ url: null })],
        })}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText(/sin fichero publicado/i)).toBeInTheDocument();
  });

  it('el paso de documentación sin plantilla lo dice, no aparece vacío', () => {
    // RF-A8.4: la plantilla de documentación todavía no está configurada.
    render(
      <StepPreviewDialog
        step={buildStep({ stepOrder: 5, type: 'signature', config: null, documents: [] })}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText(/No hay plantilla de documentación/i)).toBeInTheDocument();
  });

  it('el paso de perfil enumera los campos que se piden', () => {
    render(
      <StepPreviewDialog
        step={buildStep({ stepOrder: 4, type: 'profile', config: null })}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText('DNI / NIF')).toBeInTheDocument();
    expect(screen.getByText(/Móvil de empresa \(opcional\)/)).toBeInTheDocument();
  });

  it('un vídeo sin configurar lo dice en vez de mostrar un reproductor roto', () => {
    render(<StepPreviewDialog step={buildStep({ config: null })} onOpenChange={() => {}} />);

    expect(screen.getByText(/no tiene vídeo configurado/i)).toBeInTheDocument();
  });
});
