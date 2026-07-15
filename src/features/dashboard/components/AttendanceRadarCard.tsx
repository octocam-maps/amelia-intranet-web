import { CheckCircle2, Clock, Moon, Radar, TrendingDown } from 'lucide-react';
import type { ComponentType } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { BadgeProps } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { AttendanceRadarItem, AttendanceRadarKind } from '../domain/models';
import styles from './AttendanceRadarCard.module.css';

// Colores de ESTADO reservados (regla de dataviz del brief): van SIEMPRE con
// icono + etiqueta de texto, nunca solo color — nunca se reutilizan como
// "serie" de una paleta categórica.
const KIND_META: Record<AttendanceRadarKind, { label: string; icon: ComponentType<{ className?: string }>; variant: BadgeProps['variant'] }> = {
  late_in: { label: 'Entrada tardía', icon: Clock, variant: 'warning' },
  overtime_out: { label: 'Horas extra', icon: Moon, variant: 'info' },
  on_time: { label: 'Puntual', icon: CheckCircle2, variant: 'success' },
  negative_balance: { label: 'Balance negativo', icon: TrendingDown, variant: 'destructive' },
};

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface AttendanceRadarCardProps {
  items: AttendanceRadarItem[];
  isLoading: boolean;
}

/**
 * "Radar de asistencia" del Home admin — top 5 desvíos (`attendance_radar`
 * de `GET /dashboard/admin/metrics`). Cada fila lleva icono + etiqueta de
 * texto ADEMÁS del color (regla de accesibilidad del brief: el color nunca
 * es el único encoding).
 */
export function AttendanceRadarCard({ items, isLoading }: AttendanceRadarCardProps) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Radar de asistencia</CardTitle>
        <Radar className={styles.headerIcon} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>Sin desvíos de asistencia en el periodo seleccionado.</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const meta = KIND_META[item.kind];
              const Icon = meta.icon;
              return (
                <li key={item.userId} className={styles.row}>
                  <Avatar className={styles.avatar}>
                    {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.fullName} />}
                    <AvatarFallback>{initialsOf(item.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className={styles.info}>
                    <span className={styles.name}>{item.fullName}</span>
                    <span className={styles.detail}>{item.detail}</span>
                  </div>
                  <Badge variant={meta.variant} className={styles.badge}>
                    <Icon className={styles.badgeIcon} />
                    {meta.label}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
