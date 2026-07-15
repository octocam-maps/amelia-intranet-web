import { Building2, CalendarDays, Mail, UserCog, Users } from 'lucide-react';
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
