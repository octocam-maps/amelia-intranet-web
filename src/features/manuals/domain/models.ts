/**
 * Biblioteca de manuales de consulta (`GET /manuals`, migración backend 043).
 *
 * Es un SUPERCONJUNTO de los manuales del paso 3 del onboarding: incluye los que
 * hay que confirmar y los que solo se consultan. Aquí NO hay cascada — el gate de
 * lectura obligatoria aplica dentro del paso 3, no a la consulta.
 */
export interface Manual {
  id: string;
  title: string;
  version: number;
  url: string | null;
  /** `true` = es uno de los que hay que confirmar en el onboarding. Sirve para
   * separar «lectura obligatoria» de «consulta» en la pantalla. */
  requiredInOnboarding: boolean;
  /** Si QUIEN pregunta ya confirmó su lectura. Nadie ve el progreso de otro. */
  acknowledged: boolean;
}
