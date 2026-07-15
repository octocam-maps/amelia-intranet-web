import type { TeamBirthday, TeamMember, TeamVacationEntry } from './models';

export interface TeamRepository {
  listDirectory(): Promise<TeamMember[]>;
  /** `month` en formato `YYYY-MM`. */
  listVacationCalendar(month: string): Promise<TeamVacationEntry[]>;
  /** `days`: tamaño de la ventana, incluyendo hoy (por defecto 7). */
  listBirthdays(days?: number): Promise<TeamBirthday[]>;
}
