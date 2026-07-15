import type { ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Sparkline } from './Sparkline';
import styles from './AdminKpiCard.module.css';

const TONE_ICON_CLASS = {
  neutral: styles.iconNeutral,
  warning: styles.iconWarning,
  success: styles.iconSuccess,
} as const;

interface AdminKpiCardProps {
  label: string;
  /** Ya formateado (p. ej. `12` o `92%`) — el número nunca es `'—'` (regla
   * del brief): si no hay dato, el hook ya resuelve a `0`. */
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'warning' | 'success';
  /** Serie diaria para el sparkline. Ausente cuando el backend no calcula
   * una serie para ese KPI (p. ej. "Pendientes de aprobar") — la tarjeta se
   * pinta sin sparkline en vez de inventar una tendencia. */
  series?: number[];
  sparklineTone?: 'primary' | 'neutral';
}

export function AdminKpiCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  series,
  sparklineTone = 'primary',
}: AdminKpiCardProps) {
  return (
    <Card>
      <CardContent className={styles.content}>
        <div className={styles.top}>
          <div className={cn(styles.icon, TONE_ICON_CLASS[tone])}>
            <Icon className={styles.iconSvg} />
          </div>
          <div>
            <p className={styles.value}>{value}</p>
            <p className={styles.label}>{label}</p>
          </div>
        </div>
        <div className={styles.sparklineSlot}>
          {series && series.length >= 2 ? (
            <Sparkline values={series} tone={sparklineTone} />
          ) : (
            <p className={styles.noSeries}>Sin serie disponible</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
