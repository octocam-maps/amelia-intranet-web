import { Building2, CalendarDays, Hourglass, Mail, UserCog, Users } from 'lucide-react';
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

export function ProfileDetails({ profile }: ProfileDetailsProps) {
  const rows = [
    { icon: Mail, label: 'Correo', value: profile.email },
    { icon: Building2, label: 'Entidad', value: profile.entityName ?? 'Sin asignar' },
    { icon: Users, label: 'Departamento', value: profile.departmentName ?? 'Sin asignar' },
    { icon: UserCog, label: 'Responsable', value: profile.managerName ?? 'Sin asignar' },
    { icon: CalendarDays, label: 'Fecha de incorporación', value: formatHireDate(profile.hireDate) },
    { icon: Hourglass, label: 'Antigüedad', value: formatTenure(profile.hireDate) },
  ];

  return (
    <dl className={styles.root}>
      {rows.map(({ icon: Icon, label, value }) => (
        <div key={label} className={styles.row}>
          <dt className={styles.label}>
            <Icon className={styles.icon} />
            {label}
          </dt>
          <dd className={styles.value}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
