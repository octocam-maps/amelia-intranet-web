import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { useCreateAbsenceType } from '../application/useCreateAbsenceType';
import { useUpdateAbsenceType } from '../application/useUpdateAbsenceType';
import type { AbsenceType } from '../domain/models';
import styles from './AbsenceTypeForm.module.css';

type Requirement = 'none' | 'approval' | 'justification';

const REQUIREMENT_LABEL: Record<Requirement, string> = {
  none: 'Ninguno',
  approval: 'Aprobación',
  justification: 'Justificante',
};
const REQUIREMENTS = Object.keys(REQUIREMENT_LABEL) as Requirement[];

function requirementOf(type?: AbsenceType): Requirement {
  if (type?.requiresApproval) return 'approval';
  if (type?.requiresJustification) return 'justification';
  return 'none';
}

interface FormValues {
  name: string;
  color: string;
  affectsBalance: boolean;
  maxDaysPerYear: string;
  requirement: Requirement;
  isActive: boolean;
}

interface AbsenceTypeFormProps {
  absenceType?: AbsenceType;
  onSaved: () => void;
  onCancel: () => void;
}

/** deck-fase6/15-tipos-ausencia.png — mismo formulario para alta y edición. */
export function AbsenceTypeForm({ absenceType, onSaved, onCancel }: AbsenceTypeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: absenceType?.name ?? '',
      color: absenceType?.color ?? '#00D170',
      affectsBalance: absenceType?.affectsBalance ?? true,
      maxDaysPerYear: absenceType?.maxDaysPerYear != null ? String(absenceType.maxDaysPerYear) : '',
      requirement: requirementOf(absenceType),
      isActive: absenceType?.isActive ?? true,
    },
  });
  const { mutateAsync: createType, error: createError } = useCreateAbsenceType();
  const { mutateAsync: updateType, error: updateError } = useUpdateAbsenceType();
  const [affectsBalance, requirement, isActive] = watch(['affectsBalance', 'requirement', 'isActive']);
  const error = createError ?? updateError;

  const onSubmit = async (values: FormValues) => {
    const input = {
      name: values.name,
      color: values.color,
      affectsBalance: values.affectsBalance,
      maxDaysPerYear: values.maxDaysPerYear ? Number(values.maxDaysPerYear) : null,
      requiresApproval: values.requirement === 'approval',
      requiresJustification: values.requirement === 'justification',
      isActive: values.isActive,
    };

    if (absenceType) {
      await updateType({ id: absenceType.id, input });
    } else {
      await createType(input);
    }
    onSaved();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="typeName">Nombre *</Label>
          <Input id="typeName" placeholder="Ej. Vacaciones" {...register('name', { required: true })} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="typeColor">Color</Label>
          <input id="typeColor" type="color" className={styles.colorInput} {...register('color')} />
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="typeMaxDays">Máx. días/año (opcional)</Label>
        <Input id="typeMaxDays" type="number" min={0} placeholder="Sin límite" {...register('maxDaysPerYear')} />
      </div>

      <div className={styles.statusRow}>
        <div>
          <p className={styles.statusLabel}>Descuenta del cómputo</p>
          <p className={styles.statusHint}>Resta días del saldo de vacaciones de la persona</p>
        </div>
        <Switch checked={affectsBalance} onCheckedChange={(checked) => setValue('affectsBalance', checked)} />
      </div>

      <div className={styles.field}>
        <Label>Requisito para solicitarla</Label>
        <div className={styles.requirementGroup}>
          {REQUIREMENTS.map((option) => (
            <button
              key={option}
              type="button"
              className={cn(styles.requirementPill, requirement === option && styles.requirementPillActive)}
              onClick={() => setValue('requirement', option)}
            >
              {REQUIREMENT_LABEL[option]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.statusRow}>
        <div>
          <p className={styles.statusLabel}>Tipo activo</p>
          <p className={styles.statusHint}>Al desactivarlo, deja de aparecer al solicitar una ausencia</p>
        </div>
        <Switch checked={isActive} onCheckedChange={(checked) => setValue('isActive', checked)} />
      </div>

      {errors.name && <p className={styles.error}>Completa el nombre del tipo.</p>}
      {error && (
        <p className={styles.error}>{error instanceof Error ? error.message : 'No se pudo guardar el tipo.'}</p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          {absenceType ? 'Guardar cambios' : 'Añadir tipo'}
        </Button>
      </div>
    </form>
  );
}
