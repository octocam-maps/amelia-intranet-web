import { describe, expect, it } from 'vitest';
import { documentFromDTO, driveSyncRunFromDTO } from './mappers';
import type { DocumentDTO, DriveSyncRunDTO } from './dtos';

function baseDocumentDTO(overrides: Partial<DocumentDTO> = {}): DocumentDTO {
  return {
    id: 'doc-1',
    user_id: 'user-1',
    category: 'payslip',
    title: 'Nómina junio 2026',
    period: '2026-06',
    mime_type: 'application/pdf',
    uploaded_by: 'admin-1',
    uploaded_at: '2026-07-01T10:00:00Z',
    created_at: '2026-07-01T10:00:00Z',
    ...overrides,
  };
}

function baseSyncRunDTO(overrides: Partial<DriveSyncRunDTO> = {}): DriveSyncRunDTO {
  return {
    id: 'sync-1',
    started_at: '2026-07-17T09:00:00Z',
    finished_at: '2026-07-17T09:00:05Z',
    status: 'success',
    files_synced: 3,
    error_detail: null,
    ...overrides,
  };
}

describe('documentFromDTO', () => {
  it.each(['payslip', 'contract', 'general', 'other'] as const)(
    'mapea la categoría "%s" sin degradarla',
    (category) => {
      const document = documentFromDTO(baseDocumentDTO({ category }));

      expect(document.category).toBe(category);
    }
  );

  it('cae a "other" si el backend manda una categoría fuera de contrato', () => {
    const document = documentFromDTO(baseDocumentDTO({ category: 'categoria_que_no_existe' }));

    expect(document.category).toBe('other');
  });

  it('mapea uploaded_by null (documento insertado por el sync automático)', () => {
    const document = documentFromDTO(baseDocumentDTO({ uploaded_by: null }));

    expect(document.uploadedBy).toBeNull();
  });

  it('mapea el resto de campos de snake_case a camelCase', () => {
    const document = documentFromDTO(baseDocumentDTO());

    expect(document).toEqual({
      id: 'doc-1',
      userId: 'user-1',
      category: 'payslip',
      title: 'Nómina junio 2026',
      period: '2026-06',
      mimeType: 'application/pdf',
      uploadedBy: 'admin-1',
      uploadedAt: '2026-07-01T10:00:00Z',
      createdAt: '2026-07-01T10:00:00Z',
    });
  });
});

describe('driveSyncRunFromDTO', () => {
  it.each(['running', 'success', 'partial', 'failed'] as const)(
    'mapea el estado "%s" sin degradarlo',
    (status) => {
      const run = driveSyncRunFromDTO(baseSyncRunDTO({ status }));

      expect(run.status).toBe(status);
    }
  );

  it('cae a "failed" si el backend manda un estado fuera de contrato', () => {
    const run = driveSyncRunFromDTO(baseSyncRunDTO({ status: 'estado_que_no_existe' }));

    expect(run.status).toBe('failed');
  });

  it('mapea finished_at null (corrida todavía en curso)', () => {
    const run = driveSyncRunFromDTO(baseSyncRunDTO({ finished_at: null, status: 'running' }));

    expect(run.finishedAt).toBeNull();
  });
});
