import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useCreateHoliday } from '../application/useCreateHoliday';
import { useUpdateHoliday } from '../application/useUpdateHoliday';
import type { Holiday, HolidayScope } from '../domain/models';
import styles from './HolidayForm.module.css';

const SCOPE_LABEL: Record<HolidayScope, string> = {
  nacional: 'Nacional',
  autonomico: 'Autonómico',
  local: 'Local',
  empresa: 'Empresa',
};
const SCOPES = Object.keys(SCOPE_LABEL) as HolidayScope[];

interface FormValues {
  date: string;
  name: string;
  scope: HolidayScope;
}

interface HolidayFormProps {
  holiday?: Holiday;
  onSaved: () => void;
  onCancel: () => void;
}

/** deck-fase6/14-festivos.png — mismo formulario para alta y edición. */
export function HolidayForm({ holiday, onSaved, onCancel }: HolidayFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      date: holiday?.date ?? '',
      name: holiday?.name ?? '',
      // Los festivos añadidos a mano suelen ser locales de Barcelona o
      // cierres de empresa; 'local' es el default más útil.
      scope: holiday?.scope ?? 'local',
    },
  });
  const { mutateAsync: createHoliday, error: createError } = useCreateHoliday();
  const { mutateAsync: updateHoliday, error: updateError } = useUpdateHoliday();
  const error = createError ?? updateError;

  const onSubmit = async (values: FormValues) => {
    if (holiday) {
      await updateHoliday({ id: holiday.id, input: values });
    } else {
      await createHoliday(values);
    }
    onSaved();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.field}>
        <Label htmlFor="holidayName">Nombre del festivo *</Label>
        <Input id="holidayName" placeholder="Ej. Asunción de la Virgen" {...register('name', { required: true })} />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="holidayDate">Fecha *</Label>
          <Input id="holidayDate" type="date" {...register('date', { required: true })} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="holidayScope">Ámbito *</Label>
          <Select
            value={watch('scope')}
            onValueChange={(value) => setValue('scope', value as HolidayScope, { shouldValidate: true })}
          >
            <SelectTrigger id="holidayScope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCOPES.map((scope) => (
                <SelectItem key={scope} value={scope}>
                  {SCOPE_LABEL[scope]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(errors.name || errors.date) && <p className={styles.error}>Completa el nombre y la fecha.</p>}
      {error && (
        <p className={styles.error}>{error instanceof Error ? error.message : 'No se pudo guardar el festivo.'}</p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          {holiday ? 'Guardar cambios' : 'Añadir festivo'}
        </Button>
      </div>
    </form>
  );
}
