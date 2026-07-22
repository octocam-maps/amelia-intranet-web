import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUploadSignedDocument } from '../application/useUploadSignedDocument';
import type { OnboardingStep } from '../domain/models';
import { SignedDocumentUploadStep } from './SignedDocumentUploadStep';

vi.mock('../application/useUploadSignedDocument', () => ({
  useUploadSignedDocument: vi.fn(),
}));

function buildStep(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    id: 'step-3',
    stepOrder: 3,
    type: 'signature',
    title: 'Documentación laboral',
    config: null,
    status: 'available',
    progressPct: 0,
    data: null,
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

function mockHook(overrides: Partial<ReturnType<typeof useUploadSignedDocument>> = {}) {
  vi.mocked(useUploadSignedDocument).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    error: null,
    data: undefined,
    ...overrides,
  } as ReturnType<typeof useUploadSignedDocument>);
}

function renderStep(step: OnboardingStep) {
  return render(
    <MemoryRouter>
      <SignedDocumentUploadStep step={step} />
    </MemoryRouter>
  );
}

describe('SignedDocumentUploadStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el mensaje de bloqueo cuando el paso está locked', () => {
    mockHook();
    renderStep(buildStep({ status: 'locked' }));

    expect(screen.getByText('Completa el paso anterior para desbloquear la firma.')).toBeInTheDocument();
  });

  it('estado completado: lee employee_document_id de step.data, sin hash/IP, con enlace a Documentos', () => {
    mockHook();
    renderStep(
      buildStep({
        status: 'completed',
        data: { employee_document_id: 'doc-1' },
        completedAt: '2026-07-20T09:00:00Z',
      })
    );

    expect(screen.getByText(/documento subido/i)).toBeInTheDocument();
    expect(screen.queryByText(/hash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dirección ip/i)).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: /ver en documentos/i });
    expect(link).toHaveAttribute('href', '/documentos');
  });

  it('estado activo: el botón de subida está deshabilitado hasta seleccionar un archivo', () => {
    mockHook();
    renderStep(buildStep());

    expect(screen.getByRole('button', { name: /subir documento/i })).toBeDisabled();
  });

  it('rechaza un archivo que no es PDF sin llamar a mutate', () => {
    const mutate = vi.fn();
    mockHook({ mutate });
    renderStep(buildStep());

    const input = screen.getByLabelText(/selecciona tu pdf firmado/i) as HTMLInputElement;
    const invalidFile = new File(['x'], 'firmado.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByText(/el archivo debe ser un pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subir documento/i })).toBeDisabled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('habilita el botón tras seleccionar un PDF válido y llama a mutate con stepId + file al enviar', () => {
    const mutate = vi.fn();
    mockHook({ mutate });
    const step = buildStep();
    renderStep(step);

    const input = screen.getByLabelText(/selecciona tu pdf firmado/i) as HTMLInputElement;
    const validFile = new File(['contenido'], 'firmado.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [validFile] } });

    const button = screen.getByRole('button', { name: /subir documento/i });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(mutate).toHaveBeenCalledWith({ stepId: step.id, file: validFile });
  });
});
