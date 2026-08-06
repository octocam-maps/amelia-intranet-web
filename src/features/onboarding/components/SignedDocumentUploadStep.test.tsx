import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDownloadSignableDocument } from '../application/useDownloadSignableDocument';
import { useUploadSignedDocument } from '../application/useUploadSignedDocument';
import type { OnboardingStep, OnboardingStepDocument } from '../domain/models';
import { SignedDocumentUploadStep } from './SignedDocumentUploadStep';

vi.mock('../application/useUploadSignedDocument', () => ({
  useUploadSignedDocument: vi.fn(),
}));

vi.mock('../application/useDownloadSignableDocument', () => ({
  useDownloadSignableDocument: vi.fn(),
}));

function buildDocument(
  overrides: Partial<OnboardingStepDocument> = {},
): OnboardingStepDocument {
  return {
    id: 'doc-rgpd',
    kind: 'signature',
    title: 'Información sobre protección de datos personales',
    version: 1,
    // `generated:` — el PDF se genera al vuelo con los datos del perfil
    // (migración backend 046), no es un asset de `public/`.
    url: null,
    displayOrder: 1,
    acknowledged: false,
    // El paso 5 NO tiene cascada: el backend nunca manda `locked` aquí.
    locked: false,
    ...overrides,
  };
}

function buildStep(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    // Paso 5 y ÚLTIMO desde la reordenación de v1.1
    // (`033_onboarding_steps_reorder_v11.sql`) — antes era el 3.
    id: 'step-5',
    stepOrder: 5,
    type: 'signature',
    title: 'Sube tu documentación firmada',
    config: null,
    status: 'available',
    progressPct: 0,
    data: null,
    startedAt: null,
    completedAt: null,
    documents: [buildDocument()],
    ...overrides,
  };
}

function mockHooks({
  mutate = vi.fn(),
  download = vi.fn(),
  ...overrides
}: {
  mutate?: ReturnType<typeof vi.fn>;
  download?: ReturnType<typeof vi.fn>;
  isPending?: boolean;
  error?: Error | null;
} = {}) {
  vi.mocked(useUploadSignedDocument).mockReturnValue({
    mutate,
    isPending: overrides.isPending ?? false,
    error: overrides.error ?? null,
    data: undefined,
    variables: undefined,
  } as unknown as ReturnType<typeof useUploadSignedDocument>);

  vi.mocked(useDownloadSignableDocument).mockReturnValue({
    mutate: download,
    isPending: false,
    error: null,
    variables: undefined,
  } as unknown as ReturnType<typeof useDownloadSignableDocument>);

  return { mutate, download };
}

function renderStep(step: OnboardingStep) {
  return render(
    <MemoryRouter>
      <SignedDocumentUploadStep step={step} />
    </MemoryRouter>,
  );
}

describe('SignedDocumentUploadStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('el bloqueo nombra la lectura de los manuales, que es la puerta a este paso', () => {
    mockHooks();
    renderStep(buildStep({ status: 'locked' }));

    expect(screen.getByText(/lectura de los manuales/i)).toBeInTheDocument();
  });

  it('dice que este paso cierra el onboarding', () => {
    mockHooks();
    renderStep(buildStep());

    expect(screen.getByText(/último paso/i)).toBeInTheDocument();
  });

  it('sin documentos publicados lo dice, en vez de pedir un archivo', () => {
    mockHooks();
    renderStep(buildStep({ documents: [] }));

    expect(screen.getByText(/todavía no ha publicado la documentación/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subir firmado/i })).not.toBeInTheDocument();
  });

  // ── La descarga, que hasta la migración 046 no existía ──────────────────

  it('ofrece descargar el documento para firmarlo', () => {
    // Lo contrario de lo que se probaba antes de la 046 ("no promete una
    // descarga que todavía no existe"): ahora el PDF se genera al vuelo con los
    // datos del perfil y sí hay de dónde descargarlo.
    mockHooks();
    renderStep(buildStep());

    expect(screen.getByRole('button', { name: /descargar para firmar/i })).toBeEnabled();
  });

  it('la descarga es un botón y no un enlace, porque no hay URL que copiar', () => {
    // El endpoint exige `Authorization` (el PDF lleva DNI dentro), así que se
    // pide con fetch y se dispara el "Guardar como". Un enlace prometería una
    // dirección compartible que no existe.
    mockHooks();
    renderStep(buildStep());

    expect(screen.queryByRole('link', { name: /descargar/i })).not.toBeInTheDocument();
  });

  it('descargar pide el documento por su id', () => {
    const { download } = mockHooks();
    const document = buildDocument();
    renderStep(buildStep({ documents: [document] }));

    fireEvent.click(screen.getByRole('button', { name: /descargar para firmar/i }));

    expect(download).toHaveBeenCalledWith({
      documentId: document.id,
      title: document.title,
    });
  });

  it('avisa de que el PDF ya viene rellenado', () => {
    mockHooks();
    renderStep(buildStep());

    expect(screen.getByText(/ya lleva tus datos rellenados/i)).toBeInTheDocument();
  });

  // ── Validación del archivo antes de subirlo ─────────────────────────────

  it('el botón de subida está deshabilitado hasta seleccionar un archivo', () => {
    mockHooks();
    renderStep(buildStep());

    expect(screen.getByRole('button', { name: /subir firmado/i })).toBeDisabled();
  });

  it('rechaza un archivo que no es PDF sin llamar a mutate', () => {
    const { mutate } = mockHooks();
    renderStep(buildStep());

    const input = screen.getByLabelText(/selecciona el pdf firmado de/i) as HTMLInputElement;
    const invalidFile = new File(['x'], 'firmado.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    fireEvent.change(input, { target: { files: [invalidFile] } });

    expect(screen.getByText(/el archivo debe ser un pdf/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subir firmado/i })).toBeDisabled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('sube el PDF indicando A QUÉ documento corresponde', () => {
    // `documentId` es el cambio de contrato de la 046: sin él, el backend no
    // puede saber cuál de los cuatro documentos se acaba de entregar.
    const { mutate } = mockHooks();
    const step = buildStep();
    renderStep(step);

    const input = screen.getByLabelText(/selecciona el pdf firmado de/i) as HTMLInputElement;
    const validFile = new File(['contenido'], 'firmado.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [validFile] } });

    const button = screen.getByRole('button', { name: /subir firmado/i });
    expect(button).toBeEnabled();

    fireEvent.click(button);

    expect(mutate).toHaveBeenCalledWith({
      stepId: step.id,
      file: validFile,
      documentId: 'doc-rgpd',
    });
  });

  // ── Varios documentos ──────────────────────────────────────────────────

  it('lleva la cuenta de los documentos entregados', () => {
    mockHooks();
    renderStep(
      buildStep({
        documents: [
          buildDocument({ id: 'doc-1', title: 'RGPD', acknowledged: true }),
          buildDocument({ id: 'doc-2', title: 'Confidencialidad', displayOrder: 2 }),
          buildDocument({ id: 'doc-3', title: 'Imágenes', displayOrder: 3 }),
        ],
      }),
    );

    expect(screen.getByText(/1 de 3 documentos entregados/i)).toBeInTheDocument();
  });

  it('un documento ya entregado no vuelve a pedir archivo', () => {
    mockHooks();
    renderStep(
      buildStep({
        documents: [buildDocument({ acknowledged: true })],
      }),
    );

    expect(screen.getByText(/entregado/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /subir firmado/i })).not.toBeInTheDocument();
  });

  it('arranca desplegado el primer documento pendiente, no el primero de la lista', () => {
    // Si ya entregaste el RGPD, abrirte el RGPD otra vez no te sirve de nada.
    mockHooks();
    renderStep(
      buildStep({
        documents: [
          buildDocument({ id: 'doc-1', title: 'RGPD', acknowledged: true }),
          buildDocument({ id: 'doc-2', title: 'Confidencialidad', displayOrder: 2 }),
        ],
      }),
    );

    // Se filtra por `expanded` porque el título del documento aparece también en
    // el `aria-label` del botón de descarga y del input de archivo: sin el
    // filtro la consulta es ambigua. Solo el disparador del acordeón tiene
    // `aria-expanded`.
    expect(
      screen.getByRole('button', { name: /confidencialidad/i, expanded: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rgpd/i, expanded: false })).toBeInTheDocument();
  });

  it('nombra el documento que queda por entregar', () => {
    mockHooks();
    renderStep(
      buildStep({
        documents: [
          buildDocument({ id: 'doc-1', title: 'RGPD', acknowledged: true }),
          buildDocument({ id: 'doc-2', title: 'Reconocimiento médico', displayOrder: 2 }),
        ],
      }),
    );

    expect(screen.getByText(/te queda por entregar «reconocimiento médico»/i)).toBeInTheDocument();
  });

  // ── Paso cerrado ───────────────────────────────────────────────────────

  it('con el paso completado y todo entregado muestra el acuse y el enlace a Documentos', () => {
    mockHooks();
    renderStep(
      buildStep({
        status: 'completed',
        data: { employee_document_id: 'doc-1' },
        completedAt: '2026-07-20T09:00:00Z',
        documents: [buildDocument({ acknowledged: true })],
      }),
    );

    expect(screen.getByText(/documentación entregada/i)).toBeInTheDocument();
    // La firma nativa se eliminó (migración 030): no hay hash ni IP que mostrar.
    expect(screen.queryByText(/hash/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dirección ip/i)).not.toBeInTheDocument();
    const link = screen.getByRole('link', { name: /ver en documentos/i });
    expect(link).toHaveAttribute('href', '/documentos');
  });

  it('un documento añadido tras cerrar el paso no ofrece subida (el POST daría 422)', () => {
    // Le pasó al manual de uso de la intranet en la migración 045: el paso está
    // `completed` pero llega un documento sin entregar. `ensure_step_operable`
    // rechaza con 422, así que ofrecer el botón sería prometer un error.
    mockHooks();
    renderStep(
      buildStep({
        status: 'completed',
        completedAt: '2026-07-20T09:00:00Z',
        documents: [
          buildDocument({ id: 'doc-1', acknowledged: true }),
          buildDocument({ id: 'doc-2', title: 'Nuevo documento', displayOrder: 2 }),
        ],
      }),
    );

    expect(screen.queryByRole('button', { name: /subir firmado/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no tienes que entregar nada más/i)).toBeInTheDocument();
  });

  it('con el paso cerrado NO dice que queda algo por entregar', () => {
    // Regresión de una contradicción vista en pantalla: «Te queda por entregar
    // X» aparecía junto al panel de X diciendo «no tienes que entregarlo» y al
    // cierre diciendo «no tienes que entregar nada más».
    mockHooks();
    renderStep(
      buildStep({
        status: 'completed',
        completedAt: '2026-07-20T09:00:00Z',
        documents: [
          buildDocument({ id: 'doc-1', title: 'RGPD' }),
          buildDocument({ id: 'doc-2', title: 'Confidencialidad', displayOrder: 2 }),
        ],
      }),
    );

    expect(screen.queryByText(/te queda por entregar/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no tienes que entregar nada más/i)).toBeInTheDocument();
  });

});
