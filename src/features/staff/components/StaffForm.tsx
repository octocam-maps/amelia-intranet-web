import { ENTITY_OPTIONS } from '@/lib/entities';
import { useForm } from 'react-hook-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
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
import { useStaffRoleHistory } from '../application/useStaffRoleHistory';
import { CONTRACT_TYPE_OPTIONS } from '../domain/contractType';
import { buildRoleChangeWarning } from '../domain/roleChangeWarning';
import { RoleHistoryTimeline } from './RoleHistoryTimeline';
import type { ContractType, EntityCode, StaffMember } from '../domain/models';
import styles from './StaffForm.module.css';

const ENTITIES: { code: EntityCode; label: string }[] = [...ENTITY_OPTIONS];

/** Sentinela SOLO para el `value` del `SelectItem` — Radix no admite `''`
 * como valor de item ("A <Select.Item /> must have a value prop that is not
 * an empty string"). El estado real del formulario y el payload que se
 * manda al backend siguen usando `null` para "sin especificar"; este
 * sentinela nunca sale de este componente. Exportado solo para que el test
 * no tenga que adivinarlo. */
export const UNSPECIFIED_CONTRACT_TYPE = '__unspecified__';

interface FormValues {
  fullName: string;
  email: string;
  jobTitle: string;
  /** `UNSPECIFIED_CONTRACT_TYPE` = "sin especificar" (manda `null`); si no,
   * un `ContractType`. Nunca `''` — Radix no admite item con valor vacío. */
  contractType: ContractType | typeof UNSPECIFIED_CONTRACT_TYPE;
  department: string;
  entityCode: EntityCode;
  role: UserRole;
  hireDate: string;
  /** Vacío = automático (se calcula desde `hireDate`); un número = override
   * manual. Ver `StaffMember.vacationDaysOverride`/`vacationDaysCalculated`. */
  vacationDaysOverride: string;
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
      contractType: member?.contractType ?? UNSPECIFIED_CONTRACT_TYPE,
      department: member?.departmentName ?? '',
      entityCode: member?.entityCode ?? 'hub',
      role: member?.role ?? 'empleado',
      hireDate: member?.hireDate ?? '',
      // Se precarga con el OVERRIDE (no con `vacationDaysPerYear`, el valor
      // efectivo) — si no hay override, el input debe verse vacío
      // (automático), no con el número calculado.
      vacationDaysOverride:
        member?.vacationDaysOverride != null ? String(member.vacationDaysOverride) : '',
      isActive: member?.isActive ?? true,
    },
  });
  const { mutateAsync: createMember, error: createError } = useCreateStaffMember();
  const { mutateAsync: updateMember, error: updateError } = useUpdateStaffMember();
  // Fuente dinámica de "qué roles existen" (`GET /roles`, tabla `roles`) —
  // reemplaza el mapa `ROLE_LABEL`/`ROLES` hardcodeado: sumar un rol nuevo
  // (pasó con `socio`, migración 024) ya no requiere tocar este componente.
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  // Solo en edición: en el alta no hay historial que mostrar todavía, y el hook
  // se salta la request con `userId = null`.
  const {
    data: roleHistory,
    isLoading: isLoadingRoleHistory,
    isError: isRoleHistoryError,
  } = useStaffRoleHistory(member?.id ?? null);

  const [fullName, entityCode, isActive] = watch(['fullName', 'entityCode', 'isActive']);
  const error = createError ?? updateError;

  const onSubmit = async (values: FormValues) => {
    // Vacío = automático (`null` -> el backend calcula desde `hireDate`);
    // un número = override manual.
    const vacationDaysOverride = values.vacationDaysOverride
      ? Number(values.vacationDaysOverride)
      : null;
    // Sentinela -> `null` ("sin especificar"); si no, el valor elegido.
    const contractType =
      values.contractType === UNSPECIFIED_CONTRACT_TYPE ? null : values.contractType;

    if (member) {
      // Un cambio de rol altera permisos y CIERRA la sesión de esa persona
      // (el backend revoca sus sesiones para que el nuevo `role` aplique sin
      // esperar los 15 min del access token). Se confirma antes: es la única
      // acción de este formulario con efecto inmediato sobre otro usuario.
      const warning = buildRoleChangeWarning(member.fullName, member.role, values.role);
      if (warning && !window.confirm(warning)) return;

      // `PATCH /staff/{id}` no admite `full_name`/`email`/`hire_date` — el
      // backend no permite editarlos desde este endpoint.
      await updateMember({
        id: member.id,
        input: {
          jobTitle: values.jobTitle || null,
          contractType,
          department: values.department || null,
          entityCode: values.entityCode,
          role: values.role,
          vacationDaysOverride,
          isActive: values.isActive,
        },
      });
    } else {
      // `POST /staff` no admite `is_active` — el alta siempre entra activa.
      await createMember({
        fullName: values.fullName,
        email: values.email,
        jobTitle: values.jobTitle || null,
        contractType,
        department: values.department || null,
        entityCode: values.entityCode,
        role: values.role,
        hireDate: values.hireDate || null,
        vacationDaysOverride,
      });
    }
    onSaved();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.identity}>
        <Avatar className={styles.avatar}>
          {member?.avatarUrl && <AvatarImage src={member.avatarUrl} />}
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
          <Label htmlFor="contractType">Tipo de contrato</Label>
          <Select
            value={watch('contractType')}
            onValueChange={(value) =>
              setValue('contractType', value as FormValues['contractType'], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger id="contractType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSPECIFIED_CONTRACT_TYPE}>Sin especificar</SelectItem>
              {CONTRACT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Label htmlFor="vacationDaysOverride">Días de vacaciones/año</Label>
          <Input
            id="vacationDaysOverride"
            type="number"
            min={0}
            placeholder="Automático"
            {...register('vacationDaysOverride')}
          />
          {/* Vacío = automático (se calcula desde la fecha de alta, 10 días
           * por semestre completo trabajado) — el número que se ve aquí solo
           * aparece cuando hay un override manual vigente. */}
          {member ? (
            <p className={styles.fieldHint}>
              Calculado automáticamente: {member.vacationDaysCalculated} días
              {member.vacationDaysOverride != null && ' (hay un override manual fijado)'}
            </p>
          ) : (
            <p className={styles.fieldHint}>
              Déjalo vacío para calcularlo automáticamente según la fecha de alta.
            </p>
          )}
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

      {member && (
        <div className={styles.historySection}>
          <p className={styles.historyTitle}>Historial de roles</p>
          <RoleHistoryTimeline
            changes={roleHistory ?? []}
            isLoading={isLoadingRoleHistory}
            isError={isRoleHistoryError}
          />
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
