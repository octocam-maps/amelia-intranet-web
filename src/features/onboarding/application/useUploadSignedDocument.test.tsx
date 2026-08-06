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

  it('llama al adapter con stepId + file + documentId y, tras onSuccess, invalida [onboarding, me]', async () => {
    // `documentId` desde la migración backend 046: el paso 5 tiene cuatro
    // documentos y hay que decir a cuál corresponde el archivo firmado.
    const result = {
      id: 'upload-1',
      stepId: 'step-5',
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

    hookResult.current.mutate({ stepId: 'step-5', file, documentId: 'doc-rgpd' });

    await waitFor(() => expect(hookResult.current.isSuccess).toBe(true));

    expect(onboardingApiAdapter.uploadSignedDocument).toHaveBeenCalledWith(
      'step-5',
      file,
      'doc-rgpd',
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['onboarding', 'me'] });
  });

  it('sin documentId lo pasa como undefined: el backend resuelve solo si hay uno', async () => {
    // Compatibilidad con el cliente anterior a la 046, que subía sin id.
    vi.mocked(onboardingApiAdapter.uploadSignedDocument).mockResolvedValue({
      id: 'upload-1',
      stepId: 'step-5',
      employeeDocumentId: 'doc-1',
      uploadedAt: '2026-07-21T10:00:00Z',
    });
    const queryClient = new QueryClient();
    const file = new File(['contenido'], 'firmado.pdf', { type: 'application/pdf' });

    const { result: hookResult } = renderHook(() => useUploadSignedDocument(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    hookResult.current.mutate({ stepId: 'step-5', file });

    await waitFor(() => expect(hookResult.current.isSuccess).toBe(true));

    expect(onboardingApiAdapter.uploadSignedDocument).toHaveBeenCalledWith(
      'step-5',
      file,
      undefined,
    );
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
