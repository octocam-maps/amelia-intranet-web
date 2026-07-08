/**
 * Combina nombres de clase condicionales y filtra los falsy. Sin
 * tailwind-merge: no hay utilidades de Tailwind cuyo conflicto resolver,
 * las clases son de CSS Modules (mirror de frontend-amelia-solar-V2).
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
