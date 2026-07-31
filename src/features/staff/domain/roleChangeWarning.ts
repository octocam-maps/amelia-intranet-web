import { USER_ROLE_LABEL, canUseTimeClock, type UserRole } from '@/features/auth/domain/models';

/**
 * Texto de confirmación de un cambio de rol. Función PURA y separada del
 * componente para poder testear la redacción sin montar el formulario — es el
 * único aviso que ve el admin antes de una acción que altera permisos y cierra
 * la sesión de otra persona.
 *
 * Devuelve `null` cuando no hay cambio: quien llama usa eso para no preguntar.
 *
 * Menciona SIEMPRE las tres consecuencias reales, porque ninguna es obvia
 * mirando el formulario:
 *  · el fichaje se habilita o se retira (RF-A10),
 *  · la antigüedad se conserva (`hire_date` es inmutable — lo primero que
 *    pregunta RRHH al promocionar a un becario),
 *  · la sesión se cierra (el `role` viaja en el access token y hay que
 *    revocarlo para que el cambio aplique ya).
 */
export function buildRoleChangeWarning(
  fullName: string,
  currentRole: UserRole,
  nextRole: UserRole
): string | null {
  if (currentRole === nextRole) return null;

  const from = USER_ROLE_LABEL[currentRole];
  const to = USER_ROLE_LABEL[nextRole];
  const lines = [`${fullName} pasa de ${from} a ${to}.`];

  const hadTimeClock = canUseTimeClock(currentRole);
  const willHaveTimeClock = canUseTimeClock(nextRole);
  if (!hadTimeClock && willHaveTimeClock) {
    lines.push('Se le habilita el registro horario.');
  } else if (hadTimeClock && !willHaveTimeClock) {
    lines.push('Deja de tener registro horario. Sus fichajes anteriores se conservan.');
  }

  lines.push('Conserva su fecha de alta, su antigüedad y el resto de sus datos.');
  lines.push('Se cerrará su sesión para que los permisos nuevos se apliquen al momento.');

  return lines.join('\n');
}
