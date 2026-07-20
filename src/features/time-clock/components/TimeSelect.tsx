import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import styles from './TimeSelect.module.css';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface TimeSelectProps {
  /** '' (sin valor) o 'HH:MM' (24h). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Etiqueta base para accesibilidad (p. ej. "Hora de entrada"). */
  ariaLabel?: string;
}

/**
 * Selector de hora en 24h (HH : MM) construido con el `Select` de la app —
 * reemplaza al `<input type="time">` nativo, cuyo picker del navegador es
 * inconsistente, feo y en formato 12h (a.m./p.m.). Al elegir una parte con la
 * otra vacía, la completa a '00' para que el valor siempre sea 'HH:MM'.
 */
export function TimeSelect({ value, onChange, disabled, ariaLabel }: TimeSelectProps) {
  const parts = value ? value.split(':') : [];
  const hh = parts[0] ?? '';
  const mm = parts[1] ?? '';

  return (
    <div className={styles.group} role="group" aria-label={ariaLabel}>
      <div className={styles.field}>
        <Select value={hh} disabled={disabled} onValueChange={(h) => onChange(`${h}:${mm || '00'}`)}>
          <SelectTrigger aria-label={ariaLabel ? `${ariaLabel} (hora)` : 'Hora'}>
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <span className={styles.separator} aria-hidden="true">
        :
      </span>

      <div className={styles.field}>
        <Select value={mm} disabled={disabled} onValueChange={(m) => onChange(`${hh || '00'}:${m}`)}>
          <SelectTrigger aria-label={ariaLabel ? `${ariaLabel} (minutos)` : 'Minutos'}>
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
