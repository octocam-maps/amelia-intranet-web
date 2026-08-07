import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ApiError } from '@/lib/http/api-client';
import { ProvisionFoldersDialog } from './ProvisionFoldersDialog';
import type { BulkFolderPlan, FolderBatchResult, FolderPlanAction } from '../domain/models';

const planFolders = vi.fn();
const provisionFoldersBatch = vi.fn();

vi.mock('../infrastructure/documents-api.adapter', () => ({
  documentsApiAdapter: {
    planFolders: () => planFolders(),
    provisionFoldersBatch: (limit: number) => provisionFoldersBatch(limit),
  },
}));

function entry(email: string, action: FolderPlanAction, entityName: string | null = 'Amelia Hub') {
  return { userId: email, email, entityName, action };
}

function buildPlan(overrides: Partial<BulkFolderPlan> = {}): BulkFolderPlan {
  return {
    entries: [entry('ana@ameliahub.com', 'crear')],
    entityFoldersToCreate: ['Amelia Hub'],
    pending: 1,
    alreadyDone: 0,
    toCreate: 1,
    toMove: 0,
    categoryFoldersToCreate: 5,
    estimatedDriveWrites: 7,
    ...overrides,
  };
}

function batch(overrides: Partial<FolderBatchResult> = {}): FolderBatchResult {
  return { processed: 1, created: 1, relocated: 0, failed: 0, remaining: 0, ...overrides };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function renderDialog(open = true) {
  return render(<ProvisionFoldersDialog open={open} onOpenChange={() => {}} />, { wrapper });
}

async function pulsarCrear() {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Crear carpetas' })).toBeEnabled());
  // `act` envolviendo el clic: el bucle de lotes sigue actualizando estado
  // DESPUÉS de que `fireEvent` retorne, y sin esto React avisa de renders
  // fuera de `act` — un aviso que, si se normaliza, tapa los de verdad.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Crear carpetas' }));
  });
}

beforeEach(() => {
  planFolders.mockReset().mockResolvedValue(buildPlan());
  provisionFoldersBatch.mockReset().mockResolvedValue(batch());
});

describe('ProvisionFoldersDialog', () => {
  it('no consulta el plan mientras está cerrado', () => {
    renderDialog(false);
    expect(planFolders).not.toHaveBeenCalled();
  });

  it('enseña el plan sin crear nada al abrirse', async () => {
    renderDialog();

    await waitFor(() => expect(screen.getByText('7')).toBeInTheDocument());
    // Lo que garantiza que abrir el diálogo es inocuo: mirar no escribe.
    expect(provisionFoldersBatch).not.toHaveBeenCalled();
  });

  it('enumera POR NOMBRE a quien se le va a mover la carpeta', async () => {
    // Es la única operación sin deshacer. Un contador («se moverá 1») no deja
    // comprobar si ese 1 es quien uno espera.
    planFolders.mockResolvedValue(
      buildPlan({
        entries: [entry('luis@amelialab.com', 'recolocar', 'Amelia Lab')],
        toCreate: 0,
        toMove: 1,
      })
    );

    renderDialog();

    await waitFor(() =>
      expect(screen.getByText(/luis@amelialab\.com → Amelia Lab/)).toBeInTheDocument()
    );
  });

  it('no deja lanzar un volcado que no haría nada', async () => {
    planFolders.mockResolvedValue(
      buildPlan({ entries: [], entityFoldersToCreate: [], pending: 0, alreadyDone: 37 })
    );

    renderDialog();

    await waitFor(() => expect(screen.getByText(/Todo está ya en su sitio/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Crear carpetas' })).toBeDisabled();
  });

  it('repite en lotes hasta agotar el trabajo', async () => {
    planFolders.mockResolvedValue(buildPlan({ pending: 25, toCreate: 25 }));
    provisionFoldersBatch
      .mockResolvedValueOnce(batch({ processed: 10, created: 10, remaining: 15 }))
      .mockResolvedValueOnce(batch({ processed: 10, created: 10, remaining: 5 }))
      .mockResolvedValueOnce(batch({ processed: 5, created: 5, remaining: 0 }));

    renderDialog();
    await pulsarCrear();

    await waitFor(() => expect(provisionFoldersBatch).toHaveBeenCalledTimes(3));
    expect(await screen.findByText(/todas las carpetas están en su sitio/i)).toBeInTheDocument();
  });

  it('PARA cuando remaining deja de bajar, en vez de girar para siempre', async () => {
    // Una persona que Drive rechaza siempre nunca sale del conjunto pendiente:
    // el servidor la devuelve en cada tanda. Sin esta regla el bucle no
    // terminaría nunca y machacaría la API.
    planFolders.mockResolvedValue(buildPlan({ pending: 12, toCreate: 12 }));
    provisionFoldersBatch
      .mockResolvedValueOnce(batch({ processed: 10, created: 8, failed: 2, remaining: 4 }))
      .mockResolvedValueOnce(batch({ processed: 4, created: 0, failed: 4, remaining: 4 }));

    renderDialog();
    await pulsarCrear();

    await waitFor(() =>
      expect(screen.getByText(/4 carpeta\(s\) no se han podido crear/)).toBeInTheDocument()
    );
    // Exactamente dos: la que avanzó y la que no. Ni una más.
    expect(provisionFoldersBatch).toHaveBeenCalledTimes(2);
  });

  it('avisa de que ya hay otro volcado en curso en vez de dar un error genérico', async () => {
    // El 409 se acciona esperando, no reintentando. Un mensaje genérico
    // invitaría justo a lo contrario.
    provisionFoldersBatch.mockRejectedValue(new ApiError('Conflict', 409));

    renderDialog();
    await pulsarCrear();

    await waitFor(() =>
      expect(screen.getByText(/Ya hay un volcado de carpetas en curso/)).toBeInTheDocument()
    );
  });

  it('explica el fallo del plan en vez de dejar el diálogo en blanco', async () => {
    planFolders.mockRejectedValue(new Error('Drive no responde.'));

    renderDialog();

    await waitFor(() => expect(screen.getByText('Drive no responde.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Crear carpetas' })).toBeDisabled();
  });

  it('pide lotes acotados y no el trabajo entero', async () => {
    renderDialog();
    await pulsarCrear();

    await waitFor(() => expect(provisionFoldersBatch).toHaveBeenCalled());
    const [limit] = provisionFoldersBatch.mock.calls[0] as [number];
    expect(limit).toBeGreaterThan(0);
    expect(limit).toBeLessThanOrEqual(50);
  });
});
