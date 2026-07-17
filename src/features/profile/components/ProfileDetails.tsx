import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  CalendarIcon,
  CheckIcon,
  Cross2Icon,
  EnvelopeClosedIcon,
  Pencil2Icon,
  SewingPinIcon,
} from '@radix-ui/react-icons';
import { BuildingIcon, HourglassIcon, PhoneIcon, UserCogIcon, UsersIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useUpdateMyProfile } from '../application/useUpdateMyProfile';
import type { UserProfile } from '../domain/models';
import styles from './ProfileDetails.module.css';

/** `hire_date` llega en ISO (`YYYY-MM-DD`) o `null` — se ancla a medianoche
 * local para que el `Date` no se corra un día por zona horaria. */
function formatHireDate(hireDate: string | null): string {
  if (!hireDate) return '—';
  return new Date(`${hireDate}T00:00:00`).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Antigüedad calculada en el cliente a partir de `hire_date` — no hay
 * endpoint que la devuelva. Sin libs de fecha nuevas: diferencia de
 * años/meses con `Date` nativo, igual criterio de anclaje a medianoche que
 * `formatHireDate`. Una fecha futura (alta todavía no efectiva) no es
 * antigüedad negativa, se trata como "—". */
function formatTenure(hireDate: string | null): string {
  if (!hireDate) return '—';
  const start = new Date(`${hireDate}T00:00:00`);
  const now = new Date();
  if (start > now) return '—';

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const yearsLabel = years > 0 ? `${years} ${years === 1 ? 'año' : 'años'}` : '';
  const monthsLabel = months > 0 ? `${months} ${months === 1 ? 'mes' : 'meses'}` : '';

  if (!yearsLabel && !monthsLabel) return 'Menos de un mes en Amelia';
  if (yearsLabel && monthsLabel) return `${yearsLabel} y ${monthsLabel} en Amelia`;
  return `${yearsLabel || monthsLabel} en Amelia`;
}

interface ProfileDetailsProps {
  profile: UserProfile;
}

interface ContactFormValues {
  phone: string;
  city: string;
}

/**
 * docs/brief-diseno.md § C8 "Mi perfil" — Lote 2: teléfono y ciudad son los
 * ÚNICOS dos campos que el propio usuario puede editar aquí (`PATCH
 * /profile/me`); el resto de la ficha (correo, entidad, departamento,
 * responsable, fecha de alta) sigue siendo de solo lectura — lo gestiona el
 * admin desde `/staff`, no "Mi perfil".
 */
export function ProfileDetails({ profile }: ProfileDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { mutate, isPending, error, reset: resetMutation } = useUpdateMyProfile();
  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<ContactFormValues>({
    // `values` (no `defaultValues`): mantiene el formulario sincronizado si
    // `profile` cambia por debajo (p. ej. tras invalidar la query al
    // guardar) sin pisar lo que el usuario esté tecleando mientras no edita.
    values: { phone: profile.phone ?? '', city: profile.city ?? '' },
  });

  const readOnlyRows = [
    { icon: EnvelopeClosedIcon, label: 'Correo', value: profile.email },
    { icon: BuildingIcon, label: 'Entidad', value: profile.entityName ?? 'Sin asignar' },
    { icon: UsersIcon, label: 'Departamento', value: profile.departmentName ?? 'Sin asignar' },
    { icon: UserCogIcon, label: 'Responsable', value: profile.managerName ?? 'Sin asignar' },
    { icon: CalendarIcon, label: 'Fecha de incorporación', value: formatHireDate(profile.hireDate) },
    { icon: HourglassIcon, label: 'Antigüedad', value: formatTenure(profile.hireDate) },
  ];

  const startEditing = () => {
    resetMutation();
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetForm({ phone: profile.phone ?? '', city: profile.city ?? '' });
    resetMutation();
    setIsEditing(false);
  };

  const onSubmit = (values: ContactFormValues) => {
    mutate(
      { phone: values.phone.trim(), city: values.city.trim() },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  return (
    <div>
      <div className={styles.header}>
        <h2 className={styles.title}>Datos personales</h2>
        {!isEditing && (
          <Button type="button" variant="ghost" size="sm" onClick={startEditing}>
            <Pencil2Icon className={styles.actionIcon} />
            Editar
          </Button>
        )}
      </div>

      <dl className={styles.root}>
        {readOnlyRows.map(({ icon: Icon, label, value }) => (
          <div key={label} className={styles.row}>
            <dt className={styles.label}>
              <Icon className={styles.icon} />
              {label}
            </dt>
            <dd className={styles.value}>{value}</dd>
          </div>
        ))}

        {!isEditing && (
          <>
            <div className={styles.row}>
              <dt className={styles.label}>
                <PhoneIcon className={styles.icon} />
                Teléfono
              </dt>
              <dd className={styles.value}>{profile.phone ?? '—'}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.label}>
                <SewingPinIcon className={styles.icon} />
                Ciudad
              </dt>
              <dd className={styles.value}>{profile.city ?? '—'}</dd>
            </div>
          </>
        )}
      </dl>

      {isEditing && (
        <form className={styles.editForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.field}>
            <Label htmlFor="profile-phone">Teléfono</Label>
            <Input
              id="profile-phone"
              placeholder="+34 600 000 000"
              {...register('phone', {
                pattern: {
                  value: /^\+?[0-9 ]{6,20}$/,
                  message: 'Indica un teléfono válido (solo dígitos y espacios, 6-20 caracteres).',
                },
              })}
            />
            {errors.phone && <p className={styles.fieldError}>{errors.phone.message}</p>}
          </div>

          <div className={styles.field}>
            <Label htmlFor="profile-city">Ciudad</Label>
            <Input
              id="profile-city"
              placeholder="Madrid"
              {...register('city', {
                minLength: { value: 2, message: 'Indica una ciudad válida.' },
                maxLength: { value: 120, message: 'La ciudad es demasiado larga.' },
              })}
            />
            {errors.city && <p className={styles.fieldError}>{errors.city.message}</p>}
          </div>

          {error && (
            <p className={styles.fieldError}>
              {error instanceof Error ? error.message : 'No se pudieron guardar los cambios.'}
            </p>
          )}

          <div className={styles.formActions}>
            <Button type="button" variant="outline" size="sm" onClick={cancelEditing} disabled={isPending}>
              <Cross2Icon className={styles.actionIcon} />
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              <CheckIcon className={styles.actionIcon} />
              {isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
