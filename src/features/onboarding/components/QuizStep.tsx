import { useState } from 'react';
import { CheckCircledIcon, CrossCircledIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useSubmitQuiz } from '../application/useSubmitQuiz';
import type { OnboardingStep, QuizResult, QuizStepConfig } from '../domain/models';
import { MAX_QUIZ_ATTEMPTS } from '../domain/quizPolicy';
import styles from './QuizStep.module.css';

interface QuizStepProps {
  step: OnboardingStep;
}

/** Lee un resultado ya guardado en `step.data` sin depender de que
 * `useSubmitQuiz` haya corrido en esta sesión — así, si el usuario recarga la
 * página tras enviar, ve su resultado en vez del formulario en blanco.
 *
 * `data` solo guarda `{score}` (lo que persiste
 * `mark_step_completed_if_operable`), así que de aquí NO salen las preguntas
 * falladas ni los intentos restantes: eso solo viaja en la respuesta del
 * `POST .../quiz`. Tras recargar se ve la nota, no el desglose. */
function resultFromStepData(step: OnboardingStep): QuizResult | null {
  const data = step.data;
  if (!data || typeof data.score !== 'number' || typeof data.passed !== 'boolean') return null;
  return {
    stepId: step.id,
    score: data.score,
    passed: data.passed,
    submittedAt: typeof data.submitted_at === 'string' ? data.submitted_at : '',
    incorrectQuestionIds: [],
    attemptsUsed: 1,
    attemptsLeft: 0,
  };
}

/**
 * Cuestionario del curso, de opción múltiple y con el techo de intentos de
 * `MAX_QUIZ_ATTEMPTS` (espejo de `domain/policy.py` en el backend; antes era
 * uno solo, cambio de producto del 2026-07-29). El número NO se escribe a mano
 * en el copy: así se quedó atrás el del panel del admin.
 *
 * Al fallar se muestran las preguntas erradas, pero NO la respuesta correcta:
 * el backend manda solo los ids (`incorrectQuestionIds`) y aquí se cruzan con
 * el enunciado que ya tenemos en `config.questions`. Enseñar la solución tras
 * el primer intento convertiría el segundo en un trámite.
 */
export function QuizStep({ step }: QuizStepProps) {
  const config = step.config as QuizStepConfig;
  const { mutate, isPending, error } = useSubmitQuiz();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const isLocked = step.status === 'locked';
  const persistedResult = resultFromStepData(step);
  const shownResult = result ?? persistedResult;

  // El formulario vuelve a estar disponible si se falló y AÚN queda intento.
  // Con el paso ya `completed` (aprobado) o sin intentos, no se reintenta:
  // el backend lo rechazaría igual (`ensure_step_operable`), así que ofrecerlo
  // sería mentir.
  const canRetry = !!result && !result.passed && result.attemptsLeft > 0;
  const showResultOnly = !!shownResult && !canRetry;

  const allAnswered = config?.questions?.length > 0 && config.questions.every((q) => answers[q.id]);

  const onSubmit = () => {
    mutate({ stepId: step.id, input: { answers } }, { onSuccess: (data) => setResult(data) });
  };

  const onRetry = () => {
    // Se limpian las respuestas: reaprovecharlas invitaría a cambiar solo la
    // que falló sin releer el resto, y el segundo intento es un intento nuevo.
    setAnswers({});
    setResult(null);
  };

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear el cuestionario.</p>
      </div>
    );
  }

  if (showResultOnly && shownResult) {
    return (
      <div className={styles.root}>
        <div className={styles.resultCard}>
          <div
            className={cn(
              styles.resultRing,
              shownResult.passed ? styles.resultRingPassed : styles.resultRingFailed
            )}
          >
            {shownResult.passed ? (
              <CheckCircledIcon className={styles.resultRingIcon} />
            ) : (
              <CrossCircledIcon className={styles.resultRingIcon} />
            )}
          </div>
          <h2 className={styles.resultTitle}>
            {shownResult.passed ? '¡Cuestionario superado!' : 'No has superado el cuestionario'}
          </h2>
          <p className={styles.resultSubtitle}>
            Puntuación: <b>{shownResult.score}%</b>.{' '}
            {shownResult.passed
              ? 'Tu resultado queda registrado en tu expediente de onboarding.'
              : /* Sin el número: el mensaje solo se muestra cuando ya no
                   quedan intentos, así que decir cuántos eran no aporta y sí
                   caduca al cambiar el techo. */
                'Has agotado tus intentos. Habla con RRHH para que reabra el cuestionario.'}
          </p>
          <IncorrectQuestions config={config} incorrectIds={shownResult.incorrectQuestionIds} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>

      {canRetry && result ? (
        <div className={styles.retryPanel}>
          <div className={styles.retryHeader}>
            <CrossCircledIcon className={styles.retryIcon} />
            <div>
              <p className={styles.retryTitle}>No has superado el cuestionario</p>
              <p className={styles.retrySubtitle}>
                Puntuación: <b>{result.score}%</b>. Te queda{' '}
                <b>
                  {result.attemptsLeft} {result.attemptsLeft === 1 ? 'intento' : 'intentos'}
                </b>
                .
              </p>
            </div>
          </div>
          <IncorrectQuestions config={config} incorrectIds={result.incorrectQuestionIds} />
        </div>
      ) : (
        <div className={styles.warningBanner}>
          <ExclamationTriangleIcon className={styles.warningIcon} />
          Tienes {MAX_QUIZ_ATTEMPTS} intentos. Revisa cada respuesta antes de enviar.
        </div>
      )}

      <div className={styles.questions}>
        {config?.questions?.map((question, index) => (
          <fieldset key={question.id} className={styles.question}>
            <legend className={styles.questionText}>
              {index + 1}. {question.text}
            </legend>
            <div className={styles.options}>
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option;
                return (
                  <label key={option} className={cn(styles.option, isSelected && styles.optionSelected)}>
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={isSelected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                      className={styles.radio}
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo enviar el cuestionario.'}
        </p>
      )}

      <div className={styles.footer}>
        {canRetry && (
          <Button variant="outline" onClick={onRetry}>
            Empezar de nuevo
          </Button>
        )}
        <Button variant="dark" disabled={!allAnswered || isPending} onClick={onSubmit}>
          {isPending ? 'Enviando…' : 'Enviar cuestionario'}
        </Button>
      </div>
    </div>
  );
}

/**
 * Lista de preguntas falladas. Muestra el ENUNCIADO, nunca la respuesta
 * correcta: el backend solo manda ids y el enunciado sale de `config`, que ya
 * llega con `correct` enmascarado desde `GET /onboarding/me`. Ni siquiera
 * teniendo el dato podríamos filtrarlo — no lo tenemos.
 */
function IncorrectQuestions({
  config,
  incorrectIds,
}: {
  config: QuizStepConfig;
  incorrectIds: string[];
}) {
  if (incorrectIds.length === 0) return null;

  const textById = new Map(config?.questions?.map((q) => [q.id, q.text]) ?? []);

  return (
    <div className={styles.incorrectPanel}>
      <p className={styles.incorrectTitle}>
        {incorrectIds.length === 1 ? 'Pregunta que has fallado' : 'Preguntas que has fallado'}
      </p>
      <ul className={styles.incorrectList}>
        {incorrectIds.map((id) => (
          <li key={id} className={styles.incorrectItem}>
            <CrossCircledIcon className={styles.incorrectItemIcon} />
            {/* Si el id no cuadra con ninguna pregunta del `config` (catálogo
                editado entre el envío y el render), se muestra el id antes que
                una fila vacía. */}
            {textById.get(id) ?? id}
          </li>
        ))}
      </ul>
    </div>
  );
}
