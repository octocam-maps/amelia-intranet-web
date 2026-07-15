import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAcknowledgeManual } from '../application/useAcknowledgeManual';
import type { OnboardingStep } from '../domain/models';
import styles from './ManualStep.module.css';

interface ManualStepProps {
  step: OnboardingStep;
}

/** `POST .../acknowledge` no lleva cuerpo — una sola confirmación de
 * lectura, sin checklist de sub-secciones (eso es contenido real del
 * manual, que llega en Fase 4 vía Drive). El contenido de abajo es un
 * placeholder de texto. */
export function ManualStep({ step }: ManualStepProps) {
  const { mutate, isPending, error } = useAcknowledgeManual();

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear el manual.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>

      <div className={styles.manualCard}>
        <div className={styles.manualHeader}>
          <BookOpen className={styles.manualIcon} />
          <span>Manual de ClickUp</span>
        </div>
        <div className={styles.manualBody}>
          <p>
            ClickUp es la herramienta con la que organizamos el trabajo en Amelia. Cada equipo tiene
            su <b>Espacio</b>, dentro del cual se agrupan las tareas en <b>Listas</b>. Tu responsable te
            asignará las tareas que dependan de ti.
          </p>
          <p>
            Revisa tu bandeja cada mañana y mantén al día el estado de tus tareas: es la forma en que
            el resto del equipo sabe cómo vas.
          </p>
        </div>
      </div>

      {isCompleted ? (
        <div className={styles.confirmedBanner}>
          <CheckCircle2 className={styles.confirmedIcon} />
          Lectura confirmada
        </div>
      ) : (
        <>
          {error && (
            <p className={styles.error}>
              {error instanceof Error ? error.message : 'No se pudo confirmar la lectura.'}
            </p>
          )}
          <div className={styles.footer}>
            <Button variant="dark" disabled={isPending} onClick={() => mutate(step.id)}>
              {isPending ? 'Confirmando…' : 'He leído y confirmo'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
