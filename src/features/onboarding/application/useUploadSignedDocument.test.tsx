import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';
import { useUploadSignedDocument } from './useUploadSignedDocument';

vi.mock('../infrastructure/onboarding-api.adapter', () => ({
  onboardingApiAdapter: { uploadSignedDocument: vi.fn() },
}));

describe('useUploadSignedDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('llama al adapter con stepId + file y, tras onSuccess, invalida [onboarding, me]', async () => {
    const result = {
      id: 'upload-1',
      stepId: 'step-3',
      employeeDocumentId: 'doc-1',
      uploadedAt: '2026-07-21T10:00:00Z',
    };
    vi.mocked(onboardingApiAdapter.uploadSignedDocument).mockResolvedValue(result);
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const file = new File(['contenido'], 'firmado.pdf', { type: 'application/pdf' });

    const { result: hookResult } = renderHook(() => useUploadSignedDocument(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    hookResult.current.mutate({ stepId: 'step-3', file });

    await waitFor(() => expect(hookResult.current.isSuccess).toBe(true));

    expect(onboardingApiAdapter.uploadSignedDocument).toHaveBeenCalledWith('step-3', file);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['onboarding', 'me'] });
  });

  it('no invalida la query si el adapter rechaza', async () => {
    vi.mocked(onboardingApiAdapter.uploadSignedDocument).mockRejectedValue(new Error('falló'));
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const file = new File(['contenido'], 'firmado.pdf', { type: 'application/pdf' });

    const { result: hookResult } = renderHook(() => useUploadSignedDocument(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    hookResult.current.mutate({ stepId: 'step-3', file });

    await waitFor(() => expect(hookResult.current.isError).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
