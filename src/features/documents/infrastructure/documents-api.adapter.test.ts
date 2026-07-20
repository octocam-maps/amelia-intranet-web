import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/http/api-client';
import { documentsApiAdapter } from './documents-api.adapter';

// Mocks izados: el adapter lee el store para el Authorization header en las
// dos llamadas que bypasean `apiClient` (upload/download, body no-JSON) —
// mismo patrón que `absences-api.adapter` y `api-client.test.ts`.
const { getAccessToken } = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(() => 'access-token'),
}));

vi.mock('@/store', () => ({
  useStore: { getState: () => ({ getAccessToken }) },
}));

// `list`/`remove`/`sync` sí pasan por `apiClient` (JSON) — se mockea solo esa
// función, conservando la `ApiError` real para los `instanceof`/mensajes.
const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock('@/lib/http/api-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/http/api-client')>();
  return { ...actual, apiClient };
});

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    blob: () => Promise.resolve(new Blob([JSON.stringify(body)])),
  } as Response;
}

describe('documentsApiAdapter — upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessToken.mockReturnValue('access-token');
  });

  it('envía un FormData multipart con file/user_id/category/title (sin period si no se pasa)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, {
        id: 'doc-1',
        user_id: 'user-1',
        category: 'contract',
        title: 'Contrato indefinido',
        period: null,
        mime_type: 'application/pdf',
        uploaded_by: 'admin-1',
        uploaded_at: '2026-07-17T10:00:00Z',
        created_at: '2026-07-17T10:00:00Z',
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['contenido'], 'contrato.pdf', { type: 'application/pdf' });

    const document = await documentsApiAdapter.upload({
      file,
      userId: 'user-1',
      category: 'contract',
      title: 'Contrato indefinido',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/documents');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.headers).toEqual({ Authorization: 'Bearer access-token' });
    const body = init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(body.get('user_id')).toBe('user-1');
    expect(body.get('category')).toBe('contract');
    expect(body.get('title')).toBe('Contrato indefinido');
    expect(body.get('period')).toBeNull();
    expect(document.category).toBe('contract');
  });

  it('incluye period cuando se pasa (nómina)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(201, {
          id: 'doc-2',
          user_id: 'user-1',
          category: 'payslip',
          title: 'Nómina junio',
          period: '2026-06',
          mime_type: 'application/pdf',
          uploaded_by: 'admin-1',
          uploaded_at: '2026-07-17T10:00:00Z',
          created_at: '2026-07-17T10:00:00Z',
        })
      )
    );
    const file = new File(['contenido'], 'nomina.pdf', { type: 'application/pdf' });

    await documentsApiAdapter.upload({
      file,
      userId: 'user-1',
      category: 'payslip',
      title: 'Nómina junio',
      period: '2026-06',
    });

    const fetchMock = vi.mocked(fetch);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = init.body as FormData;
    expect(body.get('period')).toBe('2026-06');
  });

  it('propaga el mensaje de error del backend (422 validación)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(422, { detail: { message: 'El archivo supera el tamaño máximo permitido.' } })
      )
    );
    const file = new File(['contenido'], 'grande.pdf', { type: 'application/pdf' });

    await expect(
      documentsApiAdapter.upload({ file, userId: 'user-1', category: 'other', title: 'x' })
    ).rejects.toMatchObject({
      message: 'El archivo supera el tamaño máximo permitido.',
      status: 422,
    });
  });
});

describe('documentsApiAdapter — download', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessToken.mockReturnValue('access-token');
  });

  it('devuelve el blob de la respuesta con el Authorization header', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.resolve(blob) });
    vi.stubGlobal('fetch', fetchMock);

    const result = await documentsApiAdapter.download('doc-1');

    expect(result).toBe(blob);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/documents/doc-1/download');
    expect(init.headers).toEqual({ Authorization: 'Bearer access-token' });
    expect(init.credentials).toBe('include');
  });

  it('lanza ApiError si la descarga falla (403 no es propio, no admin)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(documentsApiAdapter.download('doc-1')).rejects.toBeInstanceOf(ApiError);
  });
});

describe('documentsApiAdapter — list/remove/sync (vía apiClient)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list construye el query con category y user_id solo si se pasan', async () => {
    apiClient.mockResolvedValue({ documents: [] });

    await documentsApiAdapter.list({ category: 'payslip', userId: 'user-1' });

    expect(apiClient).toHaveBeenCalledWith('/documents?category=payslip&user_id=user-1');
  });

  it('list sin params no agrega query string', async () => {
    apiClient.mockResolvedValue({ documents: [] });

    await documentsApiAdapter.list();

    expect(apiClient).toHaveBeenCalledWith('/documents');
  });

  it('remove hace DELETE a /documents/{id}', async () => {
    apiClient.mockResolvedValue(null);

    await documentsApiAdapter.remove('doc-1');

    expect(apiClient).toHaveBeenCalledWith('/documents/doc-1', { method: 'DELETE' });
  });

  it('sync hace POST a /documents/sync y mapea la respuesta', async () => {
    apiClient.mockResolvedValue({
      id: 'sync-1',
      started_at: '2026-07-17T09:00:00Z',
      finished_at: '2026-07-17T09:00:05Z',
      status: 'success',
      files_synced: 4,
      error_detail: null,
    });

    const run = await documentsApiAdapter.sync();

    expect(apiClient).toHaveBeenCalledWith('/documents/sync', { method: 'POST' });
    expect(run.filesSynced).toBe(4);
    expect(run.status).toBe('success');
  });
});
