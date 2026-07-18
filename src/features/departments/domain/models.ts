/**
 * Viaja tal cual desde `GET /departments` (tabla `departments` del backend,
 * fuente única) — mismo patrón que `features/roles/domain/models.ts`.
 * `entityCode` puede venir `null` si el departamento quedara sin entidad
 * resuelta (el JOIN del repositorio es LEFT por robustez).
 */
export interface Department {
  id: string;
  name: string;
  entityId: string;
  entityCode: string | null;
}
