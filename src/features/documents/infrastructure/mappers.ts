import { parseEnum } from '@/lib/parseEnum';
import type { Document, DocumentCategory, DriveSyncRun, DriveSyncRunStatus } from '../domain/models';
import type { DocumentDTO, DriveSyncRunDTO } from './dtos';

// Se usan en `parseEnum` — un valor fuera de contrato no debe colapsar el
// listado, solo degradar esa fila a un fallback razonable.
const DOCUMENT_CATEGORIES: DocumentCategory[] = ['payslip', 'contract', 'general', 'signed', 'other'];
const DRIVE_SYNC_RUN_STATUSES: DriveSyncRunStatus[] = ['running', 'success', 'partial', 'failed'];

export function documentFromDTO(dto: DocumentDTO): Document {
  return {
    id: dto.id,
    userId: dto.user_id,
    // Un `category` no reconocido cae en 'other' — mismo criterio que el
    // sync automático del backend con nombres de archivo fuera de convención.
    category: parseEnum(dto.category, DOCUMENT_CATEGORIES, 'other'),
    title: dto.title,
    period: dto.period,
    mimeType: dto.mime_type,
    uploadedBy: dto.uploaded_by,
    uploadedAt: dto.uploaded_at,
    createdAt: dto.created_at,
  };
}

export function driveSyncRunFromDTO(dto: DriveSyncRunDTO): DriveSyncRun {
  return {
    id: dto.id,
    startedAt: dto.started_at,
    finishedAt: dto.finished_at,
    status: parseEnum(dto.status, DRIVE_SYNC_RUN_STATUSES, 'failed'),
    filesSynced: dto.files_synced,
    errorDetail: dto.error_detail,
  };
}
