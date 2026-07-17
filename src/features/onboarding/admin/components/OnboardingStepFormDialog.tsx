import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { OnboardingStepForm } from './OnboardingStepForm';
import type { AdminOnboardingStep } from '../domain/models';

interface OnboardingStepFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: AdminOnboardingStep | null;
}

export function OnboardingStepFormDialog({ open, onOpenChange, step }: OnboardingStepFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step ? `Editar paso ${step.stepOrder} · ${step.title}` : 'Editar paso'}</DialogTitle>
        </DialogHeader>
        {step && (
          // `key` fuerza un remount si el admin pasa de editar un paso a
          // otro sin que el diálogo llegue a cerrarse del todo — evita que
          // `useForm({ defaultValues })` (que solo se lee al montar) se
          // quede con los valores del paso anterior.
          <OnboardingStepForm
            key={step.id}
            step={step}
            onSaved={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
