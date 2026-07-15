import { useForm } from 'react-hook-form';
import type { UserRole } from '@/features/auth/domain/models';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { useCreateStaffMember } from '../application/useCreateStaffMember';
import { useUpdateStaffMember } from '../application/useUpdateStaffMember';
import type { EntityCode, StaffMember } from '../domain/models';
import styles from './StaffForm.module.css';

const ENTITIES: { code: EntityCode; label: string }[] = [
  { code: 'hub', label: 'Hub' },
  { code: 'lab', label: 'Lab' },
  { code: 'ops', label: 'Ops' },
];

const ROLE_LABEL: Record<UserRole, string> = {
  empleado: 'Empleado',
  administrador: 'Administrador',
  externo_invitado: 'Externo',
};
const ROLES = Object.keys(ROLE_LABEL) as UserRole[];

interface FormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  entityCode: EntityCode;
  role: UserRole;
  hireDate: string;
  vacationDaysPerYear: string;
  isActive: boolean;
}

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface StaffFormProps {
  member?: StaffMember;
  onSaved: () => void;
  onCancel: () => void;
}

/** deck-fase6/10-editar-persona.png — mismo formulario para alta y edición;
 * `member` ausente = alta (backend crea la cuenta e invita al correo). */
export function StaffForm({ member, onSaved, onCancel }: StaffFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      fullName: member?.fullName ?? '',
      email: member?.email ?? '',
      jobTitle: member?.jobTitle ?? '',
      department: member?.department ?? '',
      entityCode: member?.entityCode ?? 'hub',
      role: member?.role ?? 'empleado',
      hireDate: member?.hireDate ?? '',
      vacationDaysPerYear: member?.vacationDaysPerYear != null ? String(member.vacationDaysPerYear) : '',
      isActive: member?.isActive ?? true,
    },
  });
  const { mutateAsync: createMember, error: createError } = useCreateStaffMember();
  const { mutateAsync: updateMember, error: updateError } = useUpdateStaffMember();

  const [fullName, entityCode, isActive] = watch(['fullName', 'entityCode', 'isActive']);
  const error = createError ?? updateError;

  const onSubmit = async (values: FormValues) => {
    const input = {
      fullName: values.fullName,
      email: values.email,
      jobTitle: values.jobTitle,
      department: values.department || null,
      entityCode: values.entityCode,
      role: values.role,
      hireDate: values.hireDate || null,
      vacationDaysPerYear: values.vacationDaysPerYear ? Number(values.vacationDaysPerYear) : null,
      isActive: values.isActive,
    };

    if (member) {
      await updateMember({ id: member.id, input });
    } else {
      await createMember(input);
    }
    onSaved();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.identity}>
        <Avatar className={styles.avatar}>
          <AvatarFallback>{initialsOf(fullName) || '—'}</AvatarFallback>
        </Avatar>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="fullName">Nombre completo *</Label>
          <Input id="fullName" {...register('fullName', { required: true })} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="email">Correo corporativo *</Label>
          <Input id="email" type="email" {...register('email', { required: true })} />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="jobTitle">Puesto *</Label>
          <Input id="jobTitle" {...register('jobTitle', { required: true })} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="department">Departamento</Label>
          <Input id="department" {...register('department')} />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label>Entidad *</Label>
          <div className={styles.entityGroup}>
            {ENTITIES.map((entity) => (
              <button
                key={entity.code}
                type="button"
                className={cn(styles.entityPill, entityCode === entity.code && styles.entityPillActive)}
                onClick={() => setValue('entityCode', entity.code, { shouldValidate: true })}
              >
                {entity.label}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <Label htmlFor="role">Rol de acceso *</Label>
          <Select
            value={watch('role')}
            onValueChange={(value) => setValue('role', value as UserRole, { shouldValidate: true })}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABEL[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="hireDate">Fecha de alta</Label>
          <Input id="hireDate" type="date" {...register('hireDate')} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="vacationDaysPerYear">Días de vacaciones/año</Label>
          <Input id="vacationDaysPerYear" type="number" min={0} {...register('vacationDaysPerYear')} />
        </div>
      </div>

      <div className={styles.statusRow}>
        <div>
          <p className={styles.statusLabel}>Estado activo</p>
          <p className={styles.statusHint}>Al desactivar, la persona pierde acceso a la intranet</p>
        </div>
        <Switch checked={isActive} onCheckedChange={(checked) => setValue('isActive', checked)} />
      </div>

      {(errors.fullName || errors.email || errors.jobTitle) && (
        <p className={styles.error}>Completa nombre, correo y puesto.</p>
      )}
      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo guardar la persona.'}
        </p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          {member ? 'Guardar cambios' : 'Añadir persona'}
        </Button>
      </div>
    </form>
  );
}
