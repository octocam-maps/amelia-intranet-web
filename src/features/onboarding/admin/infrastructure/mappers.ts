import { parseEnum } from '@/lib/parseEnum';
import type { OnboardingStepType } from '../../domain/models';
import type {
  AdminOnboardingStep,
  OnboardingProgressEmployee,
  OnboardingProgressStatus,
  UpdateOnboardingStepInput,
} from '../domain/models';
import type {
  AdminOnboardingStepDTO,
  OnboardingProgressEmployeeDTO,
  UpdateOnboardingStepDTO,
} from './dtos';

// Ambos se consultan en `Record<Enum, ...>` para pintar icono/label — un
// valor fuera de contrato dejaría ese icono/label en blanco (ver
// `lib/parseEnum`). `type` cae en 'manual' (el paso más "neutro", sin
// bloqueo especial) y `status` en 'not_started' (el estado más conservador:
// no da por completado ni en curso a alguien que no lo está).
const STEP_TYPES: OnboardingStepType[] = ['video', 'quiz', 'signature', 'manual', 'profile'];
const PROGRESS_STATUSES: OnboardingProgressStatus[] = ['not_started', 'in_progress', 'completed'];

export function adminStepFromDTO(dto: AdminOnboardingStepDTO): AdminOnboardingStep {
  return {
    id: dto.id,
    stepOrder: dto.step_order,
    type: parseEnum(dto.type, STEP_TYPES, 'manual'),
    title: dto.title,
    config: dto.config,
    isActive: dto.is_active,
  };
}

export function updateStepInputToDTO(input: UpdateOnboardingStepInput): UpdateOnboardingStepDTO {
  const dto: UpdateOnboardingStepDTO = {};
  if (input.title !== undefined) dto.title = input.title;
  if (input.isActive !== undefined) dto.is_active = input.isActive;
  if (input.config !== undefined) dto.config = input.config;
  return dto;
}

export function progressEmployeeFromDTO(dto: OnboardingProgressEmployeeDTO): OnboardingProgressEmployee {
  return {
    userId: dto.user_id,
    fullName: dto.full_name,
    email: dto.email,
    avatarUrl: dto.avatar_url,
    status: parseEnum(dto.status, PROGRESS_STATUSES, 'not_started'),
    completedSteps: dto.completed_steps,
    totalSteps: dto.total_steps,
    currentStepTitle: dto.current_step_title,
  };
}
