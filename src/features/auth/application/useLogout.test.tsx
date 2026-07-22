import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApiAdapter } from '../infrastructure/auth-api.adapter';
import { useLogout } from './useLogout';

const clearSession = vi.fn();

vi.mock('@/store', () => ({
  useStore: { getState: () => ({ clearSession }) },
}));

vi.mock('../infrastructure/auth-api.adapter', () => ({
  authApiAdapter: { logout: vi.fn() },
}));

// STATE-1 (HIGH): en un dispositivo compartido, el usuario B no debe heredar
// la caché de TanStack Query del usuario A tras el logout — de lo contrario
// stale-while-revalidate sirve PII cacheada (perfil, nóminas, saldo de
// vacaciones) antes de que la nueva sesión revalide contra el backend.
describe('useLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderWithClient(queryClient: QueryClient) {
    return renderHook(() => useLogout(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });
  }

  it('limpia toda la caché de queries y la sesión cuando el logout tiene éxito', async () => {
    vi.mocked(authApiAdapter.logout).mockResolvedValue(undefined);
    const queryClient = new QueryClient();
    queryClient.setQueryData(['profile', 'me'], { id: 'user-a', name: 'Usuaria A' });
    queryClient.setQueryData(['absences', 'balance', { userId: 'user-a' }], { days: 22 });

    const { result } = renderWithClient(queryClient);
    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(['profile', 'me'])).toBeUndefined();
    expect(queryClient.getQueryData(['absences', 'balance', { userId: 'user-a' }])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it('limpia igualmente la caché y la sesión cuando el request de logout falla', async () => {
    vi.mocked(authApiAdapter.logout).mockRejectedValue(new Error('network error'));
    const queryClient = new QueryClient();
    queryClient.setQueryData(['profile', 'me'], { id: 'user-a', name: 'Usuaria A' });

    const { result } = renderWithClient(queryClient);
    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(['profile', 'me'])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  });
});
