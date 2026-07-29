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
    // Paso 5 y ÚLTIMO desde la reordenación de v1.1
    // (`033_onboarding_steps_reorder_v11.sql`) — antes era el 3.
    id: 'step-5',
    stepOrder: 5,
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

  it('el bloqueo nombra la lectura de los manuales, que es la puerta a este paso', () => {
    mockHook();
    renderStep(buildStep({ status: 'locked' }));

    expect(screen.getByText(/lectura de los manuales/i)).toBeInTheDocument();
  });

  it('no promete una descarga que todavía no existe', () => {
    // `onboarding_documents.storage_ref` sigue a NULL y no hay endpoint que
    // sirva el binario: hasta que RRHH aporte las plantillas y exista la vía
    // de descarga, el copy no debe mandar al trabajador a buscar un botón que
    // no está. Ver el docstring del componente.
    mockHook();
    renderStep(buildStep());

    expect(screen.queryByText(/descarga el documento/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /descargar/i })).not.toBeInTheDocument();
  });

  it('dice que este paso cierra el onboarding', () => {
    mockHook();
    renderStep(buildStep());

    expect(screen.getByText(/último paso/i)).toBeInTheDocument();
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
