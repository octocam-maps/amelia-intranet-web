import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import type { UserRole } from '@/features/auth/domain/models';
import { useRoles } from '@/features/roles/application/useRoles';
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
      department: member?.departmentName ?? '',
      entityCode: member?.entityCode ?? 'hub',
      role: member?.role ?? 'empleado',
      hireDate: member?.hireDate ?? '',
      vacationDaysPerYear: member?.vacationDaysPerYear != null ? String(member.vacationDaysPerYear) : '',
      isActive: member?.isActive ?? true,
    },
  });
  const { mutateAsync: createMember, error: createError } = useCreateStaffMember();
  const { mutateAsync: updateMember, error: updateError } = useUpdateStaffMember();
  // Fuente dinámica de "qué roles existen" (`GET /roles`, tabla `roles`) —
  // reemplaza el mapa `ROLE_LABEL`/`ROLES` hardcodeado: sumar un rol nuevo
  // (pasó con `socio`, migración 024) ya no requiere tocar este componente.
  const { data: roles, isLoading: isLoadingRoles } = useRoles();

  const [fullName, entityCode, isActive] = watch(['fullName', 'entityCode', 'isActive']);
  const error = createError ?? updateError;

  const onSubmit = async (values: FormValues) => {
    const vacationDaysPerYear = values.vacationDaysPerYear ? Number(values.vacationDaysPerYear) : null;

    if (member) {
      // `PATCH /staff/{id}` no admite `full_name`/`email`/`hire_date` — el
      // backend no permite editarlos desde este endpoint.
      await updateMember({
        id: member.id,
        input: {
          jobTitle: values.jobTitle || null,
          department: values.department || null,
          entityCode: values.entityCode,
          role: values.role,
          vacationDaysPerYear,
          isActive: values.isActive,
        },
      });
    } else {
      // `POST /staff` no admite `is_active` — el alta siempre entra activa.
      await createMember({
        fullName: values.fullName,
        email: values.email,
        jobTitle: values.jobTitle || null,
        department: values.department || null,
        entityCode: values.entityCode,
        role: values.role,
        hireDate: values.hireDate || null,
        vacationDaysPerYear,
      });
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
            disabled={isLoadingRoles}
            // `role.code` viaja como `string` desde `GET /roles` (fuente
            // única: la tabla `roles`) — se castea a `UserRole` en este único
            // punto porque el resto del formulario ya lo tipa así. No es un
            // fallback silencioso: NO se descarta ningún código que el
            // backend no conozca de antemano, solo se anota su tipo.
            onValueChange={(value) => setValue('role', value as UserRole, { shouldValidate: true })}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder={isLoadingRoles ? 'Cargando roles…' : undefined} />
            </SelectTrigger>
            <SelectContent>
              {(roles ?? []).map((role) => (
                <SelectItem key={role.code} value={role.code}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="hireDate">Fecha de alta</Label>
          {/* `PATCH /staff/{id}` no admite `hire_date` — solo se puede fijar
           * al crear la persona; en edición se muestra de solo lectura para
           * no sugerir un cambio que el backend va a ignorar. */}
          <Input id="hireDate" type="date" disabled={Boolean(member)} {...register('hireDate')} />
        </div>
        <div className={styles.field}>
          <Label htmlFor="vacationDaysPerYear">Días de vacaciones/año</Label>
          <Input id="vacationDaysPerYear" type="number" min={0} {...register('vacationDaysPerYear')} />
        </div>
      </div>

      {/* `POST /staff` no admite `is_active` (el alta siempre entra activa);
       * el interruptor solo tiene efecto real al editar. */}
      {member && (
        <div className={styles.statusRow}>
          <div>
            <p className={styles.statusLabel}>Estado activo</p>
            <p className={styles.statusHint}>Al desactivar, la persona pierde acceso a la intranet</p>
          </div>
          <Switch checked={isActive} onCheckedChange={(checked) => setValue('isActive', checked)} />
        </div>
      )}

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
