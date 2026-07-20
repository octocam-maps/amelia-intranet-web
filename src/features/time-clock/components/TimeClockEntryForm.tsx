import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateTimeClockEntry } from '../application/useCreateTimeClockEntry';
import { TimeSelect } from './TimeSelect';
import styles from './TimeClockEntryForm.module.css';

interface FormValues {
  workDate: string;
  clockInTime: string;
  clockOutTime: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Alta de un tramo por SELECCIÓN MANUAL (fecha + hora de inicio/fin) — no es
 * un botón de "fichar ahora". El backend es quien valida solape y rango
 * horario; aquí solo se exige lo mínimo (fecha + entrada) antes de enviar.
 *
 * Pendiente/simplificación conocida: la hora se envía tal cual la elige el
 * usuario, con sufijo `Z` (se trata como si fuera UTC) — no hay conversión
 * de zona horaria todavía. Aceptable para la demo (un único huso, Madrid);
 * revisar si el producto crece a otras zonas.
 */
export function TimeClockEntryForm() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { workDate: todayIso(), clockInTime: '', clockOutTime: '' },
  });
  const { mutateAsync, error } = useCreateTimeClockEntry();

  const onSubmit = async (values: FormValues) => {
    await mutateAsync({
      workDate: values.workDate,
      clockIn: `${values.workDate}T${values.clockInTime}:00Z`,
      clockOut: values.clockOutTime ? `${values.workDate}T${values.clockOutTime}:00Z` : null,
    });
    reset({ workDate: values.workDate, clockInTime: '', clockOutTime: '' });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.field}>
        <Label htmlFor="workDate">Fecha</Label>
        <Input id="workDate" type="date" {...register('workDate', { required: true })} />
      </div>
      <div className={styles.field}>
        <Label>Entrada</Label>
        <Controller
          name="clockInTime"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TimeSelect value={field.value} onChange={field.onChange} ariaLabel="Hora de entrada" />
          )}
        />
      </div>
      <div className={styles.field}>
        <Label>Salida (opcional)</Label>
        <Controller
          name="clockOutTime"
          control={control}
          render={({ field }) => (
            <TimeSelect value={field.value} onChange={field.onChange} ariaLabel="Hora de salida" />
          )}
        />
      </div>
      <Button type="submit" disabled={isSubmitting} className={styles.submit}>
        Registrar tramo
      </Button>

      {(errors.workDate || errors.clockInTime) && (
        <p className={styles.error}>Completa la fecha y la hora de entrada.</p>
      )}
      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo registrar el tramo.'}
        </p>
      )}
    </form>
  );
}
