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
  phone: string | null;
  city: string | null;
}

/** Body de `PATCH /profile/me` — contrato verificado contra
 * `amelia-intranet-back/src/features/profile/infrastructure/schemas.py`
 * (`UpdateMyProfileDTO`). Sin `user_id`: RGPD, el backend lo resuelve del
 * token, nunca del body. */
export interface UpdateMyProfileDTO {
  phone?: string;
  city?: string;
}
