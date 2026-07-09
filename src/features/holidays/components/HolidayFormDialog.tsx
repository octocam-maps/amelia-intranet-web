import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { HolidayForm } from './HolidayForm';
import type { Holiday } from '../domain/models';

interface HolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente = alta de un festivo nuevo. */
  holiday?: Holiday;
}

export function HolidayFormDialog({ open, onOpenChange, holiday }: HolidayFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{holiday ? 'Editar festivo' : 'Añadir festivo'}</DialogTitle>
        </DialogHeader>
        <HolidayForm
          holiday={holiday}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
