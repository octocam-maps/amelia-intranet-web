import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useSubmitQuiz } from '../application/useSubmitQuiz';
import type { OnboardingStep, QuizResult, QuizStepConfig } from '../domain/models';
import styles from './QuizStep.module.css';

interface QuizStepProps {
  step: OnboardingStep;
}

/** Lee un resultado ya guardado en `step.data` (intento único ya
 * consumido) sin depender de que `useSubmitQuiz` haya corrido en esta
 * sesión — así, si el usuario recarga la página tras enviar, ve el
 * resultado en vez del formulario. La forma de `data` no está fijada en el
 * contrato del backend; se asume el mismo shape que la respuesta de
 * `POST .../quiz` (`score`, `passed`, `submitted_at`). */
function resultFromStepData(step: OnboardingStep): QuizResult | null {
  const data = step.data;
  if (!data || typeof data.score !== 'number' || typeof data.passed !== 'boolean') return null;
  return {
    stepId: step.id,
    score: data.score,
    passed: data.passed,
    submittedAt: typeof data.submitted_at === 'string' ? data.submitted_at : '',
  };
}

/** Cuestionario final del curso — de opción múltiple, intento único
 * (bloqueado por UNIQUE en el backend). Una vez enviado no se vuelve a
 * mostrar el formulario, ni siquiera tras recargar. */
export function QuizStep({ step }: QuizStepProps) {
  const config = step.config as QuizStepConfig;
  const { mutate, isPending, error } = useSubmitQuiz();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [localResult, setLocalResult] = useState<QuizResult | null>(null);

  const isLocked = step.status === 'locked';
  const alreadyAttempted = step.status === 'completed' || resultFromStepData(step) !== null;
  const result = localResult ?? resultFromStepData(step);

  const allAnswered = config?.questions?.length > 0 && config.questions.every((q) => answers[q.id]);

  const onSubmit = () => {
    mutate(
      { stepId: step.id, input: { answers } },
      { onSuccess: (data) => setLocalResult(data) }
    );
  };

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear el cuestionario.</p>
      </div>
    );
  }

  if (alreadyAttempted && result) {
    return (
      <div className={styles.root}>
        <div className={styles.resultCard}>
          <div className={cn(styles.resultRing, result.passed ? styles.resultRingPassed : styles.resultRingFailed)}>
            {result.passed ? (
              <CheckCircle2 className={styles.resultRingIcon} />
            ) : (
              <XCircle className={styles.resultRingIcon} />
            )}
          </div>
          <h2 className={styles.resultTitle}>
            {result.passed ? '¡Cuestionario superado!' : 'No has superado el cuestionario'}
          </h2>
          <p className={styles.resultSubtitle}>
            Puntuación: <b>{result.score}%</b>. Recuerda que era un único intento — tu resultado ya
            queda registrado en tu expediente de onboarding.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <div className={styles.warningBanner}>
        <AlertTriangle className={styles.warningIcon} />
        Solo tienes un intento. Revisa cada respuesta antes de enviar.
      </div>

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
        <Button variant="dark" disabled={!allAnswered || isPending} onClick={onSubmit}>
          {isPending ? 'Enviando…' : 'Enviar cuestionario'}
        </Button>
      </div>
    </div>
  );
}
