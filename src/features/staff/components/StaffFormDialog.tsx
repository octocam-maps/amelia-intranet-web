import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { StaffForm } from './StaffForm';
import type { StaffMember } from '../domain/models';
import styles from './StaffFormDialog.module.css';

interface StaffFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente = alta de una persona nueva. */
  member?: StaffMember;
}

export function StaffFormDialog({ open, onOpenChange, member }: StaffFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>{member ? 'Editar persona' : 'Añadir persona'}</DialogTitle>
          <p className={styles.description}>Los cambios se registran en el historial de RRHH</p>
        </DialogHeader>
        <StaffForm
          member={member}
          onSaved={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
