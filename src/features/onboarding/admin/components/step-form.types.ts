/** Formas del formulario de edición de un paso — compartidas entre
 * `OnboardingStepForm` y `QuizQuestionsEditor` (vía `useFormContext`) para
 * no duplicar el tipo en los dos archivos.
 *
 * `options` se modela como `{ value: string }[]` en vez de `string[]`
 * porque `useFieldArray` de react-hook-form necesita objetos (usa su propio
 * `field.id` interno para mantener la identidad de cada fila al
 * añadir/quitar) — un array de primitivos no es compatible con esa API.
 * `correctIndex` (no el texto de la opción) es la fuente de verdad de cuál
 * es la respuesta correcta: así, si el admin edita el texto de una opción
 * ya marcada como correcta, la marca la sigue sin quedar huérfana.
 */
export interface QuestionFormValue {
  id: string;
  text: string;
  options: { value: string }[];
  /** -1 = sin marcar todavía. */
  correctIndex: number;
}

export interface StepFormValues {
  title: string;
  isActive: boolean;
  videoUrl: string;
  /** Segundos, como texto de input. */
  videoDuration: string;
  /** Porcentaje 0-100, como texto de input (0.7 en el backend = "70" aquí). */
  thresholdPct: string;
  questions: QuestionFormValue[];
}
