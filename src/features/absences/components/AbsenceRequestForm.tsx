import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircledIcon, DotsHorizontalIcon, FileTextIcon, HomeIcon, PersonIcon } from '@radix-ui/react-icons';
import { HeartPulseIcon, type IconComponent, PalmtreeIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useAbsenceBalance } from '../application/useAbsenceBalance';
import { useAbsenceTypes } from '../application/useAbsenceTypes';
import { useCreateAbsenceRequest } from '../application/useCreateAbsenceRequest';
import styles from './AbsenceRequestForm.module.css';

interface FormValues {
  absenceTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

// Icono por `code` — el catálogo real hoy solo trae 3 tipos sembrados
// (vacaciones, baja_medica, asuntos_propios); `justificada`/`remoto`/`otros`
// llegan con el resto del grid en cuanto el seed los incorpore (tarea
// "actualizar seed absence_types a 6 tipos"). `MoreHorizontal` es el
// fallback para cualquier `code` que todavía no esté en este mapa.
const TYPE_ICON: Record<string, IconComponent> = {
  vacaciones: PalmtreeIcon,
  baja_medica: HeartPulseIcon,
  asuntos_propios: PersonIcon,
  justificada: FileTextIcon,
  remoto: HomeIcon,
  otros: DotsHorizontalIcon,
};

function toDateOnly(value: string): Date | null {
  if (!value) return null;
  const parts = value.split('-').map(Number);
  return new Date(parts[0] ?? 1970, (parts[1] ?? 1) - 1, parts[2] ?? 1);
}

/** Aproximación cliente (excluye solo fines de semana) del `days_count` que
 * calcula el backend — es solo para el contador en tiempo real del banner;
 * el valor definitivo (que también excluye festivos) lo devuelve la API al
 * crear la solicitud. */
function countWeekdaysInclusive(start: Date | null, end: Date | null): number {
  if (!start || !end || end < start) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const weekday = cursor.getDay();
    if (weekday !== 0 && weekday !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

interface AbsenceRequestFormProps {
  onSubmitted?: () => void;
  onCancel?: () => void;
}

/**
 * `days_count` NO se calcula aquí — lo hace el backend excluyendo fines de
 * semana y festivos (docs/fase-0-esquema-datos.md § 003_hr_core). El banner
 * verde es solo una previsualización con la misma regla de fines de semana.
 */
export function AbsenceRequestForm({ onSubmitted, onCancel }: AbsenceRequestFormProps) {
  const { data: types = [] } = useAbsenceTypes();
  const { data: balances = [] } = useAbsenceBalance();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { absenceTypeId: '', startDate: '', endDate: '', reason: '' },
  });
  const { mutateAsync, error } = useCreateAbsenceRequest();

  const [absenceTypeId, startDate, endDate] = watch(['absenceTypeId', 'startDate', 'endDate']);

  const balanceByType = useMemo(() => new Map(balances.map((b) => [b.absenceTypeId, b])), [balances]);
  const selectedBalance = absenceTypeId ? balanceByType.get(absenceTypeId) : undefined;
  const requestedDays = countWeekdaysInclusive(toDateOnly(startDate), toDateOnly(endDate));
  const remainingDays = selectedBalance ? selectedBalance.availableDays - requestedDays : null;

  const onSubmit = async (values: FormValues) => {
    await mutateAsync({
      absenceTypeId: values.absenceTypeId,
      startDate: values.startDate,
      endDate: values.endDate,
      reason: values.reason || undefined,
    });
    reset();
    onSubmitted?.();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.field}>
        <Label>Tipo de ausencia</Label>
        <div className={styles.typeGrid}>
          {types.map((type) => {
            const Icon = TYPE_ICON[type.code] ?? DotsHorizontalIcon;
            const isSelected = absenceTypeId === type.id;
            return (
              <button
                key={type.id}
                type="button"
                className={cn(styles.typeCard, isSelected && styles.typeCardSelected)}
                onClick={() => setValue('absenceTypeId', type.id, { shouldValidate: true })}
              >
                <Icon className={styles.typeIcon} style={type.color ? { color: type.color } : undefined} />
                <span className={styles.typeLabel}>{type.name}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" {...register('absenceTypeId', { required: true })} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="startDate">Desde</Label>
          <Input id="startDate" type="date" {...register('startDate', { required: true })} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="endDate">Hasta</Label>
          <Input id="endDate" type="date" {...register('endDate', { required: true })} />
        </div>
      </div>

      {requestedDays > 0 && (
        <div className={cn(styles.banner, remainingDays !== null && remainingDays < 0 && styles.bannerWarning)}>
          <CheckCircledIcon className={styles.bannerIcon} />
          <span className={styles.bannerText}>
            Solicitas {requestedDays} {requestedDays === 1 ? 'día' : 'días'}
            {remainingDays !== null && <> · te quedarían {remainingDays} disponibles</>}
          </span>
          {selectedBalance && <span className={styles.bannerAvailable}>{selectedBalance.availableDays} disponibles</span>}
        </div>
      )}

      <div className={styles.field}>
        <Label htmlFor="reason">Nota (opcional)</Label>
        <Textarea id="reason" placeholder="Añade un comentario para RRHH…" {...register('reason')} />
      </div>

      {(errors.absenceTypeId || errors.startDate || errors.endDate) && (
        <p className={styles.error}>Completa el tipo y el rango de fechas.</p>
      )}
      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo crear la solicitud.'}
        </p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          Enviar solicitud
        </Button>
      </div>
    </form>
  );
}
