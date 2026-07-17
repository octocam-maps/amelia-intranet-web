/**
 * `code` NO se tipa como `UserRole` (unión cerrada de `features/auth`) a
 * propósito: esta lista viaja tal cual desde `GET /roles` (tabla `roles` del
 * backend, fuente única) y el mapper no debe colapsar/descartar en
 * silencio un código que el backend ya conoce pero que el frontend todavía
 * no sumó a `UserRole` — mostrarlo (con el `name` que manda el propio
 * backend) es más seguro que ocultarlo o degradarlo a otro rol.
 */
export interface Role {
  code: string;
  name: string;
}
