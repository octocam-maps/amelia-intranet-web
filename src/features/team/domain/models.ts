export type EntityCode = 'hub' | 'lab' | 'ops';

export interface TeamMember {
  id: string;
  fullName: string;
  jobTitle: string;
  entityCode: EntityCode;
  entityName: string;
  phone: string | null;
  email: string;
  avatarUrl: string | null;
}

/** Solo vacaciones aprobadas — el backend filtra el resto de tipos de
 * ausencia antes de responder (lectura del equipo, no bandeja de RRHH). */
export interface TeamVacationEntry {
  userId: string;
  fullName: string;
  startDate: string;
  endDate: string;
}
