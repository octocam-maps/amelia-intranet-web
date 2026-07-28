import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCreateTimeClockEntriesBatch } from '../application/useCreateTimeClockEntriesBatch';
import { validateBatchRange } from '../domain/batchRangeValidation';
import type { TimeClockBatchOmissionReason, TimeClockEntriesBatchResult } from '../domain/models';
import { TimeSelect } from './TimeSelect';
import styles from './BatchTimeClockEntryForm.module.css';

/** Copy en español de España — motivo crudo del backend -> etiqueta legible.
 * NUNCA se muestra el enum tal cual (`fin_de_semana`) en la UI. */
const REASON_LABEL: Record<TimeClockBatchOmissionReason, string> = {
  fin_de_semana: 'fin de semana',
  festivo: 'festivo',
  ausencia: 'ausencia aprobada',
  ya_registrado: 'ya registrado',
  fuera_de_ventana: 'fuera de plazo',
};

interface FormValues {
  dateFrom: string;
  dateTo: string;
  clockInTime: string;
  clockOutTime: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Alta de fichaje en LOTE sobre un rango de hasta 7 días (RF-A3): mismo
 * horario de entrada/salida aplicado a varios días, con exclusiones
 * automáticas (fin de semana, festivo, ausencia aprobada, ya registrado).
 *
 * A diferencia de `TimeClockEntryForm` (alta unitaria, sin valor por
 * defecto en la hora — cada tramo se elige a propósito), aquí
 * `clockInTime`/`clockOutTime` arrancan con un horario de oficina típico
 * (08:00-17:00): el caso de uso principal del lote es fichar una semana
 * completa con el MISMO horario, así que un default razonable ahorra
 * clics en el caso común sin impedir cambiarlo.
 *
 * Valida en cliente el tope de 7 días y la fecha futura ANTES de enviar
 * (mejor UX, `validateBatchRange`), pero el backend sigue siendo la única
 * autoridad — el cliente no conoce festivos/ausencias reales.
 */
export function BatchTimeClockEntryForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      dateFrom: todayIso(),
      dateTo: todayIso(),
      clockInTime: '08:00',
      clockOutTime: '17:00',
    },
  });
  const { mutateAsync, error, isPending } = useCreateTimeClockEntriesBatch();
  const [clientError, setClientError] = useState<string | null>(null);
  const [result, setResult] = useState<TimeClockEntriesBatchResult | null>(null);

  const onSubmit = async (values: FormValues) => {
    setResult(null);
    const validation = validateBatchRange(values.dateFrom, values.dateTo, todayIso());
    if (!validation.valid) {
      setClientError(validation.error ?? 'El rango seleccionado no es válido.');
      return;
    }
    setClientError(null);

    try {
      const response = await mutateAsync({
        dateFrom: values.dateFrom,
        dateTo: values.dateTo,
        clockInTime: values.clockInTime,
        clockOutTime: values.clockOutTime || null,
      });
      setResult(response);
    } catch {
      // El error real (422 del backend, p.ej. día futuro) ya lo expone el
      // hook vía `error` — no hace falta duplicar el mensaje aquí, solo
      // evitar que la rejection quede sin manejar.
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.field}>
        <Label htmlFor="batchDateFrom">Desde</Label>
        <Input id="batchDateFrom" type="date" {...register('dateFrom', { required: true })} />
      </div>
      <div className={styles.field}>
        <Label htmlFor="batchDateTo">Hasta</Label>
        <Input id="batchDateTo" type="date" {...register('dateTo', { required: true })} />
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
      <Button type="submit" disabled={isPending} className={styles.submit}>
        {isPending ? 'Fichando…' : 'Fichar rango'}
      </Button>

      <p className={styles.hint}>
        Máximo 7 días. Se excluyen automáticamente fines de semana, festivos, días con
        ausencia aprobada y días ya fichados.
      </p>

      {(errors.dateFrom || errors.dateTo || errors.clockInTime) && (
        <p className={styles.error}>Completa el rango de fechas y la hora de entrada.</p>
      )}
      {clientError && <p className={styles.error}>{clientError}</p>}
      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo procesar el lote de fichaje.'}
        </p>
      )}

      {result && (
        <div className={styles.result}>
          <p>
            {result.created.length} día{result.created.length === 1 ? '' : 's'} fichado
            {result.created.length === 1 ? '' : 's'}
            {result.omitted.length > 0
              ? `, ${result.omitted.length} omitido${result.omitted.length === 1 ? '' : 's'}.`
              : '.'}
          </p>
          {result.omitted.length > 0 && (
            <ul className={styles.omittedList}>
              {result.omitted.map((omitted) => (
                <li key={omitted.workDate}>
                  {omitted.workDate}: {REASON_LABEL[omitted.reason]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
