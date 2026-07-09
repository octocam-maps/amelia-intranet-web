import { forwardRef } from 'react';
import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import styles from './Label.module.css';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label ref={ref} className={cn(styles.label, className)} {...props} />
));
Label.displayName = 'Label';
