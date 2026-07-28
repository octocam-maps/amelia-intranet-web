import { beforeEach, describe, expect, it, vi } from 'vitest';
import { absencesApiAdapter } from './absences-api.adapter';

// El adapter lee el store para el Authorization header en las 2 llamadas
// que bypasean `apiClient` (exportCalendarXlsx/Pdf, respuesta binaria) —
// mismo patrón que `documents-api.adapter.test.ts`.
const { getAccessToken } = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(() => 'access-token'),
}));

vi.mock('@/store', () => ({
  useStore: { getState: () => ({ getAccessToken }) },
}));

function blobResponse(status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    blob: () => Promise.resolve(new Blob(['contenido'])),
  } as Response;
}

describe('absencesApiAdapter — export del calendario (RF-A1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessToken.mockReturnValue('access-token');
  });

  it('exportCalendarXlsx sin userId NO agrega user_id al query (export global, sin cambios)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(blobResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    await absencesApiAdapter.exportCalendarXlsx({ dateFrom: '2026-07-01', dateTo: '2026-07-31' });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/absences/calendar/export.xlsx?date_from=2026-07-01&date_to=2026-07-31');
    expect(url).not.toContain('user_id');
  });

  it('exportCalendarXlsx con userId lo agrega como user_id en el query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(blobResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    await absencesApiAdapter.exportCalendarXlsx({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      userId: 'user-1',
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('user_id=user-1');
  });

  it('exportCalendarPdf con userId lo agrega como user_id en el query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(blobResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    await absencesApiAdapter.exportCalendarPdf({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      userId: 'user-2',
    });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/absences/calendar/export.pdf');
    expect(url).toContain('user_id=user-2');
  });

  it('exportCalendarPdf sin userId NO agrega user_id al query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(blobResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    await absencesApiAdapter.exportCalendarPdf({ dateFrom: '2026-07-01', dateTo: '2026-07-31' });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain('user_id');
  });

  it('propaga el header Authorization con el access token del store', async () => {
    const fetchMock = vi.fn().mockResolvedValue(blobResponse(200));
    vi.stubGlobal('fetch', fetchMock);

    await absencesApiAdapter.exportCalendarXlsx({
      dateFrom: '2026-07-01',
      dateTo: '2026-07-31',
      userId: 'user-1',
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.headers).toEqual({ Authorization: 'Bearer access-token' });
  });
});
