import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './api-client';

// Mocks izados: el api-client lee el store y (dinámicamente) el single-flight
// de refresh. Los interceptamos para observar el comportamiento del 401.
const { getAccessToken, setSessionFromRefresh, clearSession, refreshSessionSingleFlight } =
  vi.hoisted(() => ({
    getAccessToken: vi.fn<() => string | null>(() => 'access-token'),
    setSessionFromRefresh: vi.fn(),
    clearSession: vi.fn(),
    refreshSessionSingleFlight: vi.fn(),
  }));

vi.mock('@/store', () => ({
  useStore: { getState: () => ({ getAccessToken, setSessionFromRefresh, clearSession }) },
}));

vi.mock('@/features/auth/infrastructure/refresh-single-flight', () => ({
  refreshSessionSingleFlight,
}));

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('apiClient — refresh transparente ante 401', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessToken.mockReturnValue('access-token');
  });

  it('ante un 401 refresca y reintenta la petición original', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'token expirado' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    refreshSessionSingleFlight.mockResolvedValue({ accessToken: 'nuevo', expiresIn: 900 });

    const result = await apiClient<{ ok: boolean }>('/algo');

    expect(refreshSessionSingleFlight).toHaveBeenCalledTimes(1);
    expect(setSessionFromRefresh).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
    expect(clearSession).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('si el refresh falla, cierra la sesión y propaga el 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'expirado' })));
    refreshSessionSingleFlight.mockRejectedValue(new Error('sin cookie de refresh'));

    await expect(apiClient('/algo')).rejects.toMatchObject({ status: 401 });
    expect(clearSession).toHaveBeenCalledTimes(1);
  });

  it('no reintenta en bucle si el reintento vuelve a dar 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'expirado' }));
    vi.stubGlobal('fetch', fetchMock);
    refreshSessionSingleFlight.mockResolvedValue({ accessToken: 'nuevo', expiresIn: 900 });

    await expect(apiClient('/algo')).rejects.toMatchObject({ status: 401 });
    expect(refreshSessionSingleFlight).toHaveBeenCalledTimes(1); // un solo refresh
    expect(fetchMock).toHaveBeenCalledTimes(2); // original + 1 reintento, no más
  });

  it('no intenta refrescar en peticiones skipAuth (login/refresh)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { detail: 'credenciales' })));

    await expect(apiClient('/auth/login', { skipAuth: true })).rejects.toMatchObject({
      status: 401,
    });
    expect(refreshSessionSingleFlight).not.toHaveBeenCalled();
    expect(clearSession).not.toHaveBeenCalled();
  });
});
