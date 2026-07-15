import { BookMarked, BookOpen, FileSignature, Pencil, Play, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { useUpdateOnboardingStep } from '../application/useUpdateOnboardingStep';
import type { AdminOnboardingStep } from '../domain/models';
import type { OnboardingStepType } from '../../domain/models';
import styles from './OnboardingStepsList.module.css';

const STEP_ICON: Record<OnboardingStepType, LucideIcon> = {
  video: Play,
  quiz: BookOpen,
  signature: FileSignature,
  manual: BookMarked,
  profile: UserCheck,
};

// deck-fase6/16-onboarding-config.png — subtítulo fijo por tipo, copiado
// literal del mockup ("Obligatorio · …"). No viene del backend: los 5 pasos
// son fijos y conocidos, así que se mantiene como diccionario estático en
// vez de intentar derivarlo de `config`.
const STEP_DESCRIPTION: Record<OnboardingStepType, string> = {
  video: 'Obligatorio · sin saltar · desbloquea el paso siguiente',
  quiz: 'Obligatorio · cuestionario de 1 intento',
  signature: 'Obligatorio · firma digital trazable',
  manual: 'Obligatorio · confirmación de lectura',
  profile: 'Obligatorio · formulario sin campos vacíos',
};

interface OnboardingStepsListProps {
  steps: AdminOnboardingStep[];
  isLoading: boolean;
  onEdit: (step: AdminOnboardingStep) => void;
}

/** deck-fase6/16-onboarding-config.png — lista de los 5 pasos fijos del
 * onboarding. El deck muestra un asa de arrastre para reordenar y un botón
 * "Añadir paso"; el contrato de backend consumido aquí no expone ni
 * reordenar ni crear/eliminar pasos (son 5 fijos, solo editables vía
 * `PATCH .../steps/{id}`), así que esta pantalla no los ofrece. */
export function OnboardingStepsList({ steps, isLoading, onEdit }: OnboardingStepsListProps) {
  const { mutate: updateStep } = useUpdateOnboardingStep();

  if (isLoading) {
    return <p className={styles.empty}>Cargando pasos del onboarding…</p>;
  }
  if (steps.length === 0) {
    return <p className={styles.empty}>No se han encontrado pasos de onboarding configurados.</p>;
  }

  return (
    <ol className={styles.list}>
      {steps.map((step) => {
        const Icon = STEP_ICON[step.type];
        return (
          <li key={step.id} className={cn(styles.row, !step.isActive && styles.rowInactive)}>
            <span className={styles.order}>{step.stepOrder}</span>
            <span className={styles.iconBox}>
              <Icon />
            </span>
            <div className={styles.body}>
              <p className={styles.title}>{step.title}</p>
              <p className={styles.description}>{STEP_DESCRIPTION[step.type]}</p>
            </div>
            <Badge variant={step.isActive ? 'success' : 'outline'}>
              {step.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
            <span className={styles.switchWrapper}>
              <Switch
                checked={step.isActive}
                onCheckedChange={(checked) =>
                  updateStep({ stepId: step.id, input: { isActive: checked } })
                }
                aria-label={`${step.isActive ? 'Desactivar' : 'Activar'} paso ${step.stepOrder}`}
              />
            </span>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => onEdit(step)}
              aria-label={`Editar paso ${step.stepOrder}: ${step.title}`}
            >
              <Pencil />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
