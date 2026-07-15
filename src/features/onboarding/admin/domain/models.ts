import type { OnboardingStepType } from '../../domain/models';

/** `config.video` — mismo shape que el consumido por el empleado
 * (`VideoStepConfig` en `onboarding/domain/models`), pero aquí SÍ es
 * editable: el admin cambia `url`/`duration` y el PATCH reemplaza el JSONB
 * entero. */
export interface AdminVideoStepConfig {
  url: string;
  duration: number;
}

/** `config.quiz` visto por el admin — a diferencia de `QuizStepConfig` (el
 * que ve el empleado en `onboarding/domain/models`), aquí SÍ llega
 * `correct` por cada opción: es la superficie de edición del cuestionario,
 * no el intento del empleado. */
export interface AdminQuizQuestion {
  id: string;
  text: string;
  options: string[];
  correct: string;
}

export interface AdminQuizStepConfig {
  questions: AdminQuizQuestion[];
  /** 0..1 — se muestra en el formulario como porcentaje (0.7 = 70%). */
  threshold: number;
}

/**
 * Paso de onboarding visto por el admin. A diferencia de `OnboardingStep`
 * (dominio del empleado), no tiene `status`/`progressPct`/`data` — esos son
 * el AVANCE de una persona concreta, no la configuración del paso. `config`
 * se deja `unknown`: solo `video` y `quiz` tienen un editor dedicado en esta
 * pantalla; `signature`/`manual`/`profile` se editan por título/activo
 * únicamente (su `config`, si existe, nunca se reenvía en el PATCH desde
 * aquí, para no arriesgar un reemplazo con una forma que no controlamos).
 */
export interface AdminOnboardingStep {
  id: string;
  stepOrder: number;
  type: OnboardingStepType;
  title: string;
  config: unknown;
  isActive: boolean;
}

/**
 * `config`, si se manda, REEMPLAZA el JSONB entero (contrato del backend)
 * — nunca se hace un merge parcial desde el frontend.
 */
export interface UpdateOnboardingStepInput {
  title?: string;
  isActive?: boolean;
  config?: unknown;
}

export type OnboardingProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface OnboardingProgressEmployee {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  status: OnboardingProgressStatus;
  completedSteps: number;
  totalSteps: number;
  currentStepTitle: string | null;
}

export interface ResetQuizAttemptInput {
  userId: string;
}
