import { useState } from 'react';
import { ConfigTabsNav } from '@/components/composites/ConfigTabsNav';
import { Card } from '@/components/ui/Card';
import { useAdminOnboardingSteps } from '../application/useAdminOnboardingSteps';
import { useOnboardingProgress } from '../application/useOnboardingProgress';
import { OnboardingProgressTable } from '../components/OnboardingProgressTable';
import { OnboardingStepFormDialog } from '../components/OnboardingStepFormDialog';
import { OnboardingStepsList } from '../components/OnboardingStepsList';
import type { AdminOnboardingStep } from '../domain/models';
import styles from './OnboardingAdminPage.module.css';

/**
 * deck-fase6/16-onboarding-config.png — la sección A (pasos) replica ese
 * mockup. La sección B (progreso de la plantilla) no está en el deck: sigue
 * el estilo de tabla ya usado en esta misma fase (`StaffTable`,
 * `AbsenceApprovalList`) en vez de improvisar un patrón nuevo.
 */
export function OnboardingAdminPage() {
  const [editingStep, setEditingStep] = useState<AdminOnboardingStep | null>(null);

  const {
    data: steps = [],
    isLoading: stepsLoading,
    isError: stepsErrored,
  } = useAdminOnboardingSteps();
  const {
    data: employees = [],
    isLoading: progressLoading,
    isError: progressErrored,
  } = useOnboardingProgress();

  // El endpoint de progreso no dice qué paso es el cuestionario — se
  // resuelve aquí, a partir de la lista de pasos, y se le pasa a la tabla
  // para que sepa qué `step_id` mandar al reabrir un intento.
  const quizStepId = steps.find((step) => step.type === 'quiz')?.id ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración · Onboarding</h1>
          <p className={styles.subtitle}>Pasos del flujo de bienvenida y progreso de la plantilla</p>
        </div>
      </div>

      <ConfigTabsNav active="onboarding" />

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Pasos del onboarding</h2>
            <p className={styles.sectionHint}>Flujo lineal con bloqueo secuencial</p>
          </div>
        </div>

        {stepsErrored && (
          <p className={styles.loadError}>
            No se han podido cargar los pasos del onboarding. Inténtalo de nuevo en unos minutos.
          </p>
        )}
        <OnboardingStepsList steps={steps} isLoading={stepsLoading} onEdit={setEditingStep} />
      </Card>

      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Progreso de la plantilla</h2>
            <p className={styles.sectionHint}>Avance de cada persona en el flujo de onboarding</p>
          </div>
        </div>

        {progressErrored && (
          <p className={styles.loadError}>
            No se ha podido cargar el progreso de la plantilla. Inténtalo de nuevo en unos minutos.
          </p>
        )}
        <OnboardingProgressTable
          employees={employees}
          isLoading={progressLoading}
          quizStepId={quizStepId}
        />
      </Card>

      <OnboardingStepFormDialog
        open={editingStep !== null}
        onOpenChange={(open) => !open && setEditingStep(null)}
        step={editingStep}
      />
    </div>
  );
}
