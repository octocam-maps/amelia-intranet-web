import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Badge.module.css';

const VARIANT_MAP = {
  default: styles.variantDefault,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
  destructive: styles.variantDestructive,
  info: styles.variantInfo,
  outline: styles.variantOutline,
  // Navy sólido (`--header-bg`) — mismo criterio que Button variant="dark".
  // deck-fase6/14-festivos.png § badge "Nacional".
  dark: styles.variantDark,
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof VARIANT_MAP;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span className={cn(styles.base, VARIANT_MAP[variant], className)} {...props} />;
}
