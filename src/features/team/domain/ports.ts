import type { TeamMember, TeamVacationEntry } from './models';

export interface TeamRepository {
  listDirectory(): Promise<TeamMember[]>;
  /** `month` en formato `YYYY-MM`. */
  listVacationCalendar(month: string): Promise<TeamVacationEntry[]>;
}
