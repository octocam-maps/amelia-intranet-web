import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/http/api-client';
import { onboardingApiAdapter } from './onboarding-api.adapter';

// Mismo patrón que `documents-api.adapter.test.ts`: `uploadSignedDocument` no
// pasa por `apiClient` (body FormData, no JSON), así que se mockea `fetch`
// directamente y el store solo para el Authorization header.
const { getAccessToken } = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(() => 'access-token'),
}));

vi.mock('@/store', () => ({
  useStore: { getState: () => ({ getAccessToken }) },
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('onboardingApiAdapter — uploadSignedDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessToken.mockReturnValue('access-token');
  });

  it('envía un FormData multipart con un único campo file (sin user_id) al endpoint del paso', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(201, {
        id: 'upload-1',
        step_id: 'step-3',
        employee_document_id: 'doc-1',
        uploaded_at: '2026-07-21T10:00:00Z',
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['contenido'], 'firmado.pdf', { type: 'application/pdf' });

    const result = await onboardingApiAdapter.uploadSignedDocument('step-3', file);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/onboarding/steps/step-3/documents');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(init.headers).toEqual({ Authorization: 'Bearer access-token' });
    const body = init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(body.get('user_id')).toBeNull();
    expect(result).toEqual({
      id: 'upload-1',
      stepId: 'step-3',
      employeeDocumentId: 'doc-1',
      uploadedAt: '2026-07-21T10:00:00Z',
    });
  });

  it('propaga el mensaje de error del backend (422, tipo de archivo o tamaño)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(422, { detail: { message: 'El archivo debe ser un PDF.' } })
      )
    );
    const file = new File(['contenido'], 'firmado.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await expect(onboardingApiAdapter.uploadSignedDocument('step-3', file)).rejects.toMatchObject({
      message: 'El archivo debe ser un PDF.',
      status: 422,
    });
    await expect(onboardingApiAdapter.uploadSignedDocument('step-3', file)).rejects.toBeInstanceOf(ApiError);
  });
});
