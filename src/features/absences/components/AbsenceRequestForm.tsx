import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { useAbsenceTypes } from '../application/useAbsenceTypes';
import { useCreateAbsenceRequest } from '../application/useCreateAbsenceRequest';
import styles from './AbsenceRequestForm.module.css';

interface FormValues {
  absenceTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

/**
 * `days_count` NO se calcula aquí — lo hace el backend excluyendo fines de
 * semana y festivos (docs/fase-0-esquema-datos.md § 003_hr_core). El
 * formulario solo recoge el rango de fechas elegido por el usuario.
 */
export function AbsenceRequestForm() {
  const { data: types = [] } = useAbsenceTypes();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { absenceTypeId: '', startDate: '', endDate: '', reason: '' },
  });
  const { mutateAsync, error } = useCreateAbsenceRequest();

  const onSubmit = async (values: FormValues) => {
    await mutateAsync({
      absenceTypeId: values.absenceTypeId,
      startDate: values.startDate,
      endDate: values.endDate,
      reason: values.reason || undefined,
    });
    reset();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="absenceTypeId">Tipo</Label>
          <select
            id="absenceTypeId"
            className={styles.select}
            {...register('absenceTypeId', { required: true })}
          >
            <option value="">Selecciona un tipo…</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <Label htmlFor="startDate">Desde</Label>
          <Input id="startDate" type="date" {...register('startDate', { required: true })} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="endDate">Hasta</Label>
          <Input id="endDate" type="date" {...register('endDate', { required: true })} />
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="reason">Motivo (opcional)</Label>
        <Textarea id="reason" placeholder="Cuéntanos brevemente el motivo…" {...register('reason')} />
      </div>

      <Button type="submit" disabled={isSubmitting} className={styles.submit}>
        Solicitar ausencia
      </Button>

      {(errors.absenceTypeId || errors.startDate || errors.endDate) && (
        <p className={styles.error}>Completa el tipo y el rango de fechas.</p>
      )}
      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo crear la solicitud.'}
        </p>
      )}
    </form>
  );
}
