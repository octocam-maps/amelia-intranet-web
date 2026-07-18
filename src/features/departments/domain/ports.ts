import type { Department } from './models';

export interface DepartmentRepository {
  /** `GET /departments` — accesible a los roles con onboarding COMPLETO
   * (`administrador`, `empleado`, `socio`); hoy lo consume el Paso 5 del
   * onboarding (`ProfileStep`) para poblar el selector de departamento. */
  list(): Promise<Department[]>;
}
