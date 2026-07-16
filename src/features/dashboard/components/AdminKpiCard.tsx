import type { ComponentType } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
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
}

export function AdminKpiCard({ label, value, icon: Icon, tone = 'neutral' }: AdminKpiCardProps) {
  return (
    <Card>
      <CardContent className={styles.content}>
        <div className={cn(styles.icon, TONE_ICON_CLASS[tone])}>
          <Icon className={styles.iconSvg} />
        </div>
        <div>
          <p className={styles.value}>{value}</p>
          <p className={styles.label}>{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
