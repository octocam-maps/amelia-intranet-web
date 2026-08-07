import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ProvisionFoldersDialog } from './ProvisionFoldersDialog';
import type { BulkFolderPlan, FolderPlanAction } from '../domain/models';

const planFolders = vi.fn();
const provisionFolders = vi.fn();

vi.mock('../infrastructure/documents-api.adapter', () => ({
  documentsApiAdapter: {
    planFolders: () => planFolders(),
    provisionFolders: () => provisionFolders(),
  },
}));

function entry(email: string, action: FolderPlanAction, entityName: string | null = 'Amelia Hub') {
  return { userId: email, email, entityName, action, missingCategories: [] };
}

function buildPlan(overrides: Partial<BulkFolderPlan> = {}): BulkFolderPlan {
  return {
    entries: [entry('ana@ameliahub.com', 'crear')],
    entityFoldersToCreate: ['Amelia Hub'],
    toCreate: 1,
    toMove: 0,
    alreadyOk: 0,
    categoryFoldersToCreate: 5,
    estimatedDriveWrites: 7,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function renderDialog(open = true) {
  return render(<ProvisionFoldersDialog open={open} onOpenChange={() => {}} />, { wrapper });
}

beforeEach(() => {
  planFolders.mockReset().mockResolvedValue(buildPlan());
  provisionFolders.mockReset().mockResolvedValue({
    id: 'run-1',
    startedAt: '2026-08-06T10:00:00Z',
    finishedAt: '2026-08-06T10:00:03Z',
    status: 'success',
    created: 1,
    skipped: 0,
    failed: 0,
    errorDetail: null,
  });
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
    expect(provisionFolders).not.toHaveBeenCalled();
  });

  it('enumera POR NOMBRE a quien se le va a mover la carpeta', async () => {
    // Es la única operación sin deshacer. Un contador («se moverá 1») no deja
    // comprobar si ese 1 es quien uno espera.
    planFolders.mockResolvedValue(
      buildPlan({
        entries: [entry('luis@amelialab.com', 'mover', 'Amelia Lab')],
        toCreate: 0,
        toMove: 1,
      })
    );

    renderDialog();

    await waitFor(() =>
      expect(screen.getByText(/luis@amelialab\.com → Amelia Lab/)).toBeInTheDocument()
    );
  });

  it('solo crea las carpetas cuando se confirma', async () => {
    renderDialog();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Crear carpetas' })).toBeEnabled()
    );

    fireEvent.click(screen.getByRole('button', { name: 'Crear carpetas' }));

    await waitFor(() => expect(provisionFolders).toHaveBeenCalledTimes(1));
  });

  it('no deja lanzar un volcado que no haría nada', async () => {
    planFolders.mockResolvedValue(
      buildPlan({
        entries: [entry('ana@ameliahub.com', 'ya_en_su_sitio')],
        entityFoldersToCreate: [],
        toCreate: 0,
        alreadyOk: 1,
        categoryFoldersToCreate: 0,
        estimatedDriveWrites: 0,
      })
    );

    renderDialog();

    await waitFor(() => expect(screen.getByText(/Todo está ya en su sitio/)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Crear carpetas' })).toBeDisabled();
  });

  it('tras un fallo parcial invita a repetir, porque el batch es idempotente', async () => {
    provisionFolders.mockResolvedValue({
      id: 'run-2',
      startedAt: '2026-08-06T10:00:00Z',
      finishedAt: '2026-08-06T10:00:05Z',
      status: 'partial',
      created: 30,
      skipped: 0,
      failed: 6,
      errorDetail: '6 empleado(s) fallaron durante el provisioning.',
    });

    renderDialog();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Crear carpetas' })).toBeEnabled()
    );
    fireEvent.click(screen.getByRole('button', { name: 'Crear carpetas' }));

    await waitFor(() => expect(screen.getByText(/solo se hará lo que falte/)).toBeInTheDocument());
  });

  it('explica el fallo del plan en vez de dejar el diálogo en blanco', async () => {
    planFolders.mockRejectedValue(new Error('Drive no responde.'));

    renderDialog();

    await waitFor(() => expect(screen.getByText('Drive no responde.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Crear carpetas' })).toBeDisabled();
  });
});
