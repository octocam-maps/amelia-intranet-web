import type { Holiday, HolidayImportResult, HolidayInput, HolidayListParams } from './models';

export interface HolidaysRepository {
  list(params?: HolidayListParams): Promise<Holiday[]>;
  create(input: HolidayInput): Promise<Holiday>;
  update(id: string, input: Partial<HolidayInput>): Promise<Holiday>;
  remove(id: string): Promise<void>;
  importOfficial(year: number): Promise<HolidayImportResult>;
}
