import type { TeamAbsenceEntry, TeamBirthday, TeamMember } from './models';

export interface TeamRepository {
  listDirectory(): Promise<TeamMember[]>;
  /** `month` en formato `YYYY-MM`. Alcance fijo al departamento del usuario
   * autenticado — lo resuelve el backend, no se puede pedir otro. */
  listTeamCalendar(month: string): Promise<TeamAbsenceEntry[]>;
  /** `days`: tamaño de la ventana, incluyendo hoy (por defecto 7). */
  listBirthdays(days?: number): Promise<TeamBirthday[]>;
}
