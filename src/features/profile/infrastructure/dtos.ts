/** Forma snake_case tal cual la devuelve el backend (Pydantic). La mayoría
 * de los campos son nullable con los datos actuales — ver domain/models.ts. */
export interface UserProfileDTO {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  job_title: string | null;
  hire_date: string | null;
  entity_name: string | null;
  department_name: string | null;
  manager_name: string | null;
  is_external: boolean;
}
