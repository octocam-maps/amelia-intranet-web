import type {
  CreateTimeClockEntryInput,
  ListTimeClockEntriesParams,
  TimeClockEntry,
  UpdateTimeClockEntryInput,
} from './models';

export interface TimeClockRepository {
  create(input: CreateTimeClockEntryInput): Promise<TimeClockEntry>;
  list(params: ListTimeClockEntriesParams): Promise<TimeClockEntry[]>;
  update(entryId: string, input: UpdateTimeClockEntryInput): Promise<TimeClockEntry>;
  remove(entryId: string): Promise<void>;
  /** Descarga el CSV como blob — no es una URL directa porque necesita el
   * header `Authorization` (no hay sesión por cookie fuera de `/auth`). */
  exportCsv(params: ListTimeClockEntriesParams): Promise<Blob>;
}
