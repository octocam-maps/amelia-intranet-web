import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateTimeClockEntry } from '../application/useCreateTimeClockEntry';
import { validateWorkDateNotFuture } from '../domain/batchRangeValidation';
import { toIsoDateTime } from '../domain/wallClock';
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
 * La hora se convierte a instante con el offset REAL del navegador
 * (`toIsoDateTime`). Antes se enviaba `` `${workDate}T${hora}:00Z` ``, pegando
 * una `Z` a una hora local: "las 08:00" se guardaba como 08:00 UTC, o sea las
 * 10:00 de Madrid en verano. El listado lo disimulaba porque leía el ISO en
 * crudo, pero el informe XLSX de RRHH convierte a Madrid y mostraba 10:00 —
 * pantalla y registro legal de jornada decían cosas distintas del mismo tramo.
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
      clockIn: toIsoDateTime(values.workDate, values.clockInTime),
      clockOut: values.clockOutTime
        ? toIsoDateTime(values.workDate, values.clockOutTime)
        : null,
    });
    reset({ workDate: values.workDate, clockInTime: '', clockOutTime: '' });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.field}>
        <Label htmlFor="workDate">Fecha</Label>
        {/* `max` + `validate`: LOGIC-2 (art. 34.9 ET) prohíbe la fecha futura
            "ni en alta unitaria ni en lote", pero solo la pestaña de "Varios
            días" lo avisaba en cliente — esta mandaba la petición y esperaba el
            422. El `max` frena el selector nativo; el `validate` cubre la
            escritura a mano, que el `max` no impide en todos los navegadores. */}
        <Input
          id="workDate"
          type="date"
          max={todayIso()}
          {...register('workDate', {
            required: true,
            validate: (value) => validateWorkDateNotFuture(value, todayIso()).error ?? true,
          })}
        />
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

      {/* El mensaje de `validate` (fecha futura) se muestra tal cual; el
          genérico queda para el caso de campo vacío. Antes cualquier error de
          fecha caía en "Completa la fecha…", que no decía nada del futuro. */}
      {errors.workDate?.message ? (
        <p className={styles.error}>{errors.workDate.message}</p>
      ) : (
        (errors.workDate || errors.clockInTime) && (
          <p className={styles.error}>Completa la fecha y la hora de entrada.</p>
        )
      )}
      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo registrar el tramo.'}
        </p>
      )}
    </form>
  );
}
