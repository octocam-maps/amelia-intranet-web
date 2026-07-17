/**
 * Valida en runtime que un valor recibido del backend pertenezca al enum
 * esperado, en vez de asumirlo con un `as EnumType` crudo.
 *
 * Los DTOs tipan estos campos como `string` (el backend no manda un enum
 * real, manda el texto que guarda en la columna `CHECK`), pero nada impide
 * en runtime que llegue un valor fuera de contrato — una migración a
 * medias, un valor nuevo añadido en el backend antes que en el frontend,
 * un typo. Un `as` crudo deja pasar ese valor tal cual; como casi todos
 * estos enums se consultan luego en un `Record<Enum, string>` para pintar
 * un badge/label (`STATUS_LABEL[value]`, `ROLE_LABEL[value]`…), el
 * resultado no es un crash — es un badge o una etiqueta en blanco,
 * silenciosa y difícil de reproducir en QA.
 *
 * `parseEnum` corta ese vector: si el valor no está en `allowed`, devuelve
 * `fallback` (avisando por consola en desarrollo) en vez de propagar el
 * valor desconocido.
 *
 * Alcance deliberado: se aplica en los mappers donde el campo se renderiza
 * como label/badge visible (role, status, category, scope, entidad…). No
 * cubre el 100% de los `as` del código — p. ej. `OnboardingStep.type` se
 * deja con su cast original a propósito: el switch que lo consume
 * (`OnboardingPage`) ya tiene un `default: null` de seguridad, y forzar un
 * fallback aquí podría hacer que se renderizase el paso *equivocado* (con
 * el `config` de otro tipo de paso) en vez de simplemente nada.
 */
export function parseEnum<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  if (import.meta.env.DEV) {
    console.warn(`[parseEnum] valor no reconocido "${value}" — se usa el fallback "${fallback}"`);
  }
  return fallback;
}

/**
 * Variante para campos `Enum | null` donde el backend ya distingue
 * "sin valor" (`null`) de "valor desconocido". Un valor no-null que no esté
 * en `allowed` colapsa a `null` (mismo estado que "sin ámbito asignado" /
 * "sin entidad" que el dominio ya contempla) en vez de un fallback inventado.
 */
export function parseEnumNullable<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[]
): T | null {
  if (value == null) return null;
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  if (import.meta.env.DEV) {
    console.warn(`[parseEnum] valor no reconocido "${value}" — se usa null`);
  }
  return null;
}
