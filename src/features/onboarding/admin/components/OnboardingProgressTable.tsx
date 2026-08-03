import { useState } from 'react';
import { ResetIcon } from '@radix-ui/react-icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useResetQuizAttempt } from '../application/useResetQuizAttempt';
import type {
  EmployeeStepProgress,
  OnboardingProgressEmployee,
  OnboardingProgressStatus,
} from '../domain/models';
import styles from './OnboardingProgressTable.module.css';

const STATUS_LABEL: Record<OnboardingProgressStatus, string> = {
  not_started: 'Sin empezar',
  in_progress: 'En curso',
  completed: 'Completado',
};

/** Etiqueta de cada estado de paso, para el `title` y el texto accesible. Los
 * chips muestran solo el número, así que sin esto un lector de pantalla leería
 * "1 2 3 4 5" sin ninguna información. */
const STEP_STATUS_LABEL: Record<EmployeeStepProgress['status'], string> = {
  locked: 'bloqueado',
  available: 'disponible',
  in_progress: 'en curso',
  completed: 'completado',
};

/* El estado se distingue por color Y por el `title`/texto accesible — el color
   solo no basta para quien no distingue verdes (WCAG 1.4.1). */
const STEP_CHIP_CLASS: Record<EmployeeStepProgress['status'], string | undefined> = {
  locked: undefined,
  available: styles.stepChipAvailable,
  in_progress: styles.stepChipInProgress,
  completed: styles.stepChipCompleted,
};

const STATUS_CLASS: Record<OnboardingProgressStatus, string | undefined> = {
  not_started: styles.statusNotStarted,
  in_progress: styles.statusInProgress,
  completed: styles.statusCompleted,
};

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface OnboardingProgressTableProps {
  employees: OnboardingProgressEmployee[];
  isLoading: boolean;
  /** Id del paso `quiz` — viene de `GET /admin/steps`, no de `/admin/progress`
   * (ese endpoint no expone qué paso es cuál). Si aún no cargó, el botón
   * "Reabrir cuestionario" se deshabilita en vez de romper la tabla. */
  quizStepId: string | null;
}

/** No hay mockup en el deck para esta sección (deck-fase6/16-onboarding-config
 * solo cubre "Pasos del onboarding") — se sigue el estilo de
 * `StaffTable`/`AbsenceApprovalList` (misma fase) para la tabla de plantilla. */
export function OnboardingProgressTable({ employees, isLoading, quizStepId }: OnboardingProgressTableProps) {
  const { mutate: resetQuiz, isPending } = useResetQuizAttempt();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleReopen = (employee: OnboardingProgressEmployee) => {
    if (!quizStepId) return;
    const confirmed = window.confirm(
      `¿Reabrir el cuestionario de onboarding de ${employee.fullName}? Podrá volver a intentarlo.`
    );
    if (!confirmed) return;

    resetQuiz(
      { stepId: quizStepId, userId: employee.userId },
      {
        onSuccess: () =>
          setFeedback({ ok: true, message: `Cuestionario reabierto para ${employee.fullName}.` }),
        onError: (error) =>
          setFeedback({
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : `No se pudo reabrir el cuestionario de ${employee.fullName}.`,
          }),
      }
    );
  };

  if (isLoading) {
    return <p className={styles.empty}>Cargando el progreso de la plantilla…</p>;
  }
  if (employees.length === 0) {
    return <p className={styles.empty}>Todavía no hay onboarding en curso en la plantilla.</p>;
  }

  return (
    <div className={styles.root}>
      {feedback && (
        <p className={cn(styles.banner, feedback.ok ? styles.bannerSuccess : styles.bannerError)}>
          {feedback.message}
        </p>
      )}

      {/* `tabIndex={0}` + `role="region"`: un contenedor con scroll que no es
          alcanzable con el tabulador deja sin acceso al contenido a quien no usa
          ratón (axe: `scrollable-region-focusable`). El `aria-label` es lo que
          se anuncia al entrar en la región. */}
      <div
        className={styles.scroller}
        tabIndex={0}
        role="region"
        aria-label="Progreso de onboarding de la plantilla"
      >
        <table className={styles.table}>
        <thead>
          <tr>
            <th>Persona</th>
            <th>Estado</th>
            <th>Progreso</th>
            <th>Paso actual</th>
            <th aria-label="Acciones" />
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const progressPct =
              employee.totalSteps > 0
                ? Math.round((employee.completedSteps / employee.totalSteps) * 100)
                : 0;
            return (
              <tr key={employee.userId}>
                <td>
                  <div className={styles.person}>
                    <Avatar>
                      {employee.avatarUrl && (
                        <AvatarImage src={employee.avatarUrl} />
                      )}
                      <AvatarFallback>{initialsOf(employee.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={styles.fullName}>{employee.fullName}</p>
                      <p className={styles.email}>{employee.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={cn(styles.status, STATUS_CLASS[employee.status])}>
                    <span className={styles.statusDot} />
                    {STATUS_LABEL[employee.status]}
                  </span>
                </td>
                <td>
                  <div className={styles.progressCell}>
                    <span className={styles.progressCount}>
                      {employee.completedSteps} de {employee.totalSteps} pasos · {progressPct}%
                    </span>
                    <div
                      className={styles.progressTrack}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progressPct}
                      aria-label={`Progreso de onboarding de ${employee.fullName}`}
                    >
                      <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                    </div>
                    {/* Desglose paso a paso: «3 de 5» no dice DÓNDE se atascó
                        alguien, que es la pregunta que hace RRHH. Va aquí y no en
                        un desplegable para que se vea de un barrido, sin un clic
                        por persona. */}
                    {employee.steps.length > 0 && (
                      <ol className={styles.stepChips}>
                        {employee.steps.map((step) => (
                          <li
                            key={step.stepOrder}
                            className={cn(styles.stepChip, STEP_CHIP_CLASS[step.status])}
                            // El título lleva el nombre del paso y su estado: los
                            // chips son números, y sin esto un lector de pantalla
                            // solo diría "1 2 3 4 5".
                            title={`Paso ${step.stepOrder}: ${step.title} — ${STEP_STATUS_LABEL[step.status]}`}
                          >
                            <span className={styles.srOnly}>
                              {`Paso ${step.stepOrder}, ${step.title}: ${STEP_STATUS_LABEL[step.status]}`}
                            </span>
                            <span aria-hidden="true">{step.stepOrder}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </td>
                <td className={styles.currentStep}>{employee.currentStepTitle ?? '—'}</td>
                <td>
                  {employee.status === 'in_progress' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className={styles.reopenButton}
                      disabled={!quizStepId || isPending}
                      onClick={() => handleReopen(employee)}
                      title={!quizStepId ? 'No se ha podido cargar el paso del cuestionario' : undefined}
                    >
                      <ResetIcon />
                      Reabrir cuestionario
                    </Button>
                  ) : (
                    <span className={styles.dash}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}
