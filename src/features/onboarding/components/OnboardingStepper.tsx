import { CheckIcon, LockClosedIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import type { OnboardingStep, OnboardingStepType } from '../domain/models';
import styles from './OnboardingStepper.module.css';

// Etiqueta corta por `type` — el `title` que manda el backend es una frase
// completa ("Vídeo de bienvenida e historia del Hincator") pensada para la
// cabecera del paso, no para el riel de navegación (deck Fase 2, paso 1-5).
const STEP_LABEL: Record<OnboardingStepType, string> = {
  video: 'Vídeo',
  quiz: 'Curso',
  signature: 'Documento',
  manual: 'Manual',
  profile: 'Perfil',
};

interface OnboardingStepperProps {
  steps: OnboardingStep[];
  activeStepId: string | null;
  onSelectStep: (step: OnboardingStep) => void;
}

/** Riel horizontal de pasos — deck Fase 2 "Escritorio · viendo/completado".
 * Solo se puede seleccionar un paso `completed` (revisar) o el activo
 * (`available`/`in_progress`); los `locked` se muestran con candado y no
 * disparan `onSelectStep`. */
export function OnboardingStepper({ steps, activeStepId, onSelectStep }: OnboardingStepperProps) {
  return (
    <ol className={styles.rail}>
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed';
        const isLocked = step.status === 'locked';
        const isActive = step.id === activeStepId;
        const isLast = index === steps.length - 1;

        return (
          <li key={step.id} className={styles.item}>
            <button
              type="button"
              className={cn(
                styles.node,
                isCompleted && styles.nodeCompleted,
                isActive && styles.nodeActive,
                isLocked && styles.nodeLocked
              )}
              disabled={isLocked}
              onClick={() => onSelectStep(step)}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Paso ${step.stepOrder} · ${STEP_LABEL[step.type]} · ${
                isCompleted ? 'completado' : isLocked ? 'bloqueado' : 'disponible'
              }`}
            >
              {isCompleted ? (
                <CheckIcon className={styles.nodeIcon} />
              ) : isLocked ? (
                <LockClosedIcon className={styles.nodeIcon} />
              ) : (
                step.stepOrder
              )}
            </button>
            <span className={cn(styles.label, isActive && styles.labelActive)}>
              {STEP_LABEL[step.type]}
            </span>
            {!isLast && (
              <span className={cn(styles.connector, isCompleted && styles.connectorFilled)} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
