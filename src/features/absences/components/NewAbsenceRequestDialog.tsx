import { useState } from 'react';
import type { ReactElement } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { AbsenceRequestForm } from './AbsenceRequestForm';

interface NewAbsenceRequestDialogProps {
  /** Botón disparador — cada pantalla lo estiliza distinto (dark en el
   * topbar, verde en la cabecera de Ausencias), pero abren el mismo modal. */
  trigger: ReactElement;
}

export function NewAbsenceRequestDialog({ trigger }: NewAbsenceRequestDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva solicitud de ausencia</DialogTitle>
        </DialogHeader>
        <AbsenceRequestForm onSubmitted={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
