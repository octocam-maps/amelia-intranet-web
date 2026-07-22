import { API_BASE_URL, apiClient, ApiError } from '@/lib/http/api-client';
import { useStore } from '@/store';
import type { Document, DriveSyncRun, ListDocumentsParams, UploadDocumentInput } from '../domain/models';
import type { DocumentsRepository } from '../domain/ports';
import type { DocumentDTO, DocumentListDTO, DriveSyncRunDTO } from './dtos';
import { documentFromDTO, driveSyncRunFromDTO } from './mappers';

function listQuery(params: ListDocumentsParams): string {
  const search = new URLSearchParams();
  if (params.category) search.set('category', params.category);
  // El backend solo resuelve `user_id` si quien pide es administrador —
  // para empleado/socio lo ignora y devuelve siempre lo propio.
  if (params.userId) search.set('user_id', params.userId);
  const query = search.toString();
  return query ? `?${query}` : '';
}

function authHeaders(): Record<string, string> {
  const accessToken = useStore.getState().getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

/** Extrae el mensaje de error del backend (`{"detail": {"message": ...}}` o
 * `{"detail": "..."}`) — mismo formato que `apiClient`, duplicado aquí
 * porque estas dos llamadas no pasan por `apiClient` (body no-JSON). */
async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object' && 'message' in detail) {
      const message = (detail as { message: unknown }).message;
      if (typeof message === 'string') return message;
    }
  }
  return fallback;
}

export const documentsApiAdapter: DocumentsRepository = {
  async list(params: ListDocumentsParams = {}): Promise<Document[]> {
    const dto = await apiClient<DocumentListDTO>(`/documents${listQuery(params)}`);
    return dto.documents.map(documentFromDTO);
  },

  async upload(input: UploadDocumentInput): Promise<Document> {
    // No usa `apiClient`: el body es `FormData` (multipart), no JSON — el
    // navegador tiene que fijar su propio `Content-Type` con el boundary, y
    // `apiClient` siempre fuerza `application/json`.
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('user_id', input.userId);
    formData.append('category', input.category);
    formData.append('title', input.title);
    if (input.period) formData.append('period', input.period);

    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
      body: formData,
    });
    if (!response.ok) {
      const message = await parseErrorMessage(response, 'No se pudo subir el documento.');
      throw new ApiError(message, response.status);
    }
    const dto = (await response.json()) as DocumentDTO;
    return documentFromDTO(dto);
  },

  async download(id: string): Promise<Blob> {
    // Igual que `absences/infrastructure/absences-api.adapter.ts::exportCalendarPdf`:
    // la respuesta es el binario en streaming, no JSON.
    const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      credentials: 'include',
      headers: authHeaders(),
    });
    if (!response.ok) {
      throw new ApiError('No se pudo descargar el documento.', response.status);
    }
    return response.blob();
  },

  async remove(id: string): Promise<void> {
    await apiClient<null>(`/documents/${id}`, { method: 'DELETE' });
  },

  async sync(): Promise<DriveSyncRun> {
    const dto = await apiClient<DriveSyncRunDTO>('/documents/sync', { method: 'POST' });
    return driveSyncRunFromDTO(dto);
  },
};
