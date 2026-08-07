import { parseEnum } from '@/lib/parseEnum';
import { FOLDER_PLAN_ACTIONS } from '../domain/models';
import type {
  BulkFolderPlan,
  Document,
  DocumentCategory,
  FolderBatchResult,
  DriveSyncRun,
  DriveSyncRunStatus,
  FolderPlanEntry,
} from '../domain/models';
import type {
  BulkFolderPlanDTO,
  DocumentDTO,
  FolderBatchResultDTO,
  DriveSyncRunDTO,
  FolderPlanEntryDTO,
} from './dtos';

// Se usan en `parseEnum` — un valor fuera de contrato no debe colapsar el
// listado, solo degradar esa fila a un fallback razonable.
const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'payslip',
  'contract',
  'general',
  'signed',
  'other',
];
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

export function folderPlanEntryFromDTO(dto: FolderPlanEntryDTO): FolderPlanEntry {
  return {
    userId: dto.user_id,
    email: dto.email,
    entityName: dto.entity_name,
    // Fallback a 'crear' y no a 'mover': ante un veredicto que no entendemos,
    // la UI debe describir la opción INOCUA. Anunciar un movimiento inexistente
    // asustaría sin motivo; al revés, ocultaría el único caso que hay que
    // revisar antes de confirmar.
    action: parseEnum(dto.action, FOLDER_PLAN_ACTIONS, 'crear'),
  };
}

export function bulkFolderPlanFromDTO(dto: BulkFolderPlanDTO): BulkFolderPlan {
  return {
    entries: dto.entries.map(folderPlanEntryFromDTO),
    entityFoldersToCreate: dto.entity_folders_to_create,
    pending: dto.pending,
    alreadyDone: dto.already_done,
    toCreate: dto.to_create,
    toMove: dto.to_move,
    categoryFoldersToCreate: dto.category_folders_to_create,
    estimatedDriveWrites: dto.estimated_drive_writes,
  };
}

export function folderBatchResultFromDTO(dto: FolderBatchResultDTO): FolderBatchResult {
  return {
    processed: dto.processed,
    created: dto.created,
    relocated: dto.relocated,
    failed: dto.failed,
    remaining: dto.remaining,
  };
}
