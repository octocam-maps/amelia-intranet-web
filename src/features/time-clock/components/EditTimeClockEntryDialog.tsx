import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useUpdateTimeClockEntry } from '../application/useUpdateTimeClockEntry';
import type { TimeClockEntry } from '../domain/models';
import styles from './EditTimeClockEntryDialog.module.css';

interface FormValues {
  clockInTime: string;
  clockOutTime: string;
}

interface EditTimeClockEntryDialogProps {
  /** `null` = diálogo cerrado — no hay tramo seleccionado todavía. */
  entry: TimeClockEntry | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * B-2c: corrección de un tramo AJENO desde la vista aumentada del admin
 * ("Ver toda la plantilla"). Reutiliza el `PATCH /time-clock/entries/{id}`
 * ya existente (`UpdateTimeClockEntryUseCase` ya permite al admin editar el
 * tramo de cualquier usuario) — este diálogo solo cablea el formulario, no
 * duplica el endpoint.
 *
 * Mismo criterio TZ que `TimeClockEntryForm`: la hora se envía con sufijo
 * `Z` (se trata como si fuera UTC) — simplificación conocida y aceptada
 * para un único huso horario (Madrid).
 */
export function EditTimeClockEntryDialog({ entry, onOpenChange }: EditTimeClockEntryDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { clockInTime: '', clockOutTime: '' } });
  const { mutateAsync, error, reset: resetMutation } = useUpdateTimeClockEntry();

  useEffect(() => {
    if (entry) {
      reset({
        clockInTime: entry.clockIn.slice(11, 16),
        clockOutTime: entry.clockOut ? entry.clockOut.slice(11, 16) : '',
      });
      resetMutation();
    }
  }, [entry, reset, resetMutation]);

  if (!entry) {
    return null;
  }

  const onSubmit = async (values: FormValues) => {
    await mutateAsync({
      entryId: entry.id,
      input: {
        clockIn: `${entry.workDate}T${values.clockInTime}:00Z`,
        clockOut: values.clockOutTime ? `${entry.workDate}T${values.clockOutTime}:00Z` : null,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tramo{entry.fullName ? ` de ${entry.fullName}` : ''}</DialogTitle>
          <p className={styles.description}>
            {entry.workDate} — corrige la hora de entrada o salida de este tramo
          </p>
        </DialogHeader>
        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.row}>
            <div className={styles.field}>
              <Label htmlFor="editClockInTime">Entrada</Label>
              <Input
                id="editClockInTime"
                type="time"
                {...register('clockInTime', { required: true })}
              />
            </div>
            <div className={styles.field}>
              <Label htmlFor="editClockOutTime">Salida</Label>
              <Input id="editClockOutTime" type="time" {...register('clockOutTime')} />
            </div>
          </div>

          {errors.clockInTime && (
            <p className={styles.error}>La hora de entrada es obligatoria.</p>
          )}
          {error && (
            <p className={styles.error}>
              {error instanceof Error ? error.message : 'No se pudo guardar el tramo.'}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="dark" disabled={isSubmitting}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
