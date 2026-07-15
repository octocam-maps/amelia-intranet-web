import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { AbsenceTypeForm } from './AbsenceTypeForm';
import type { AbsenceType } from '../domain/models';

interface AbsenceTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente = alta de un tipo nuevo. */
  absenceType?: AbsenceType;
}

export function AbsenceTypeFormDialog({ open, onOpenChange, absenceType }: AbsenceTypeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{absenceType ? 'Editar tipo de ausencia' : 'Nuevo tipo de ausencia'}</DialogTitle>
        </DialogHeader>
        <AbsenceTypeForm
          absenceType={absenceType}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
