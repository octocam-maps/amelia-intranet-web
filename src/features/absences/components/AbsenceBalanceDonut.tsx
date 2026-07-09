import styles from './AbsenceBalanceDonut.module.css';

interface AbsenceBalanceDonutProps {
  available: number;
  used: number;
  total: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut nativo (SVG, sin librería de gráficos) — deck
 * 03-ausencias-empleado "Resumen de días". El arco relleno representa lo
 * USADO (mismo criterio que la barra de `VacationSummaryCard`: el color
 * primario marca progreso de consumo, no disponibilidad); el número grande
 * del centro es "disponibles", que es el dato que de verdad importa mirar.
 */
export function AbsenceBalanceDonut({ available, used, total }: AbsenceBalanceDonutProps) {
  const usedFraction = total > 0 ? Math.min(1, Math.max(0, used / total)) : 0;
  const usedLength = CIRCUMFERENCE * usedFraction;

  return (
    <div className={styles.wrapper}>
      <svg viewBox="0 0 120 120" className={styles.svg} role="img" aria-label={`${available} días disponibles de ${total}`}>
        <circle cx="60" cy="60" r={RADIUS} className={styles.track} strokeWidth="14" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          className={styles.progress}
          strokeWidth="14"
          fill="none"
          strokeDasharray={`${usedLength} ${CIRCUMFERENCE - usedLength}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className={styles.center}>
        <span className={styles.number}>{available}</span>
        <span className={styles.label}>disponibles</span>
      </div>
    </div>
  );
}
