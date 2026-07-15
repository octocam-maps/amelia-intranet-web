import styles from './Sparkline.module.css';

const WIDTH = 100;
const HEIGHT = 28;
const STROKE_WIDTH = 2;

interface SparklineProps {
  /** Serie cronológica (un valor por día) de `AdminMetricsTrends`. */
  values: number[];
  /** Verde de marca por defecto — pensado para tendencias positivas
   * (docs/identidad-visual.md). Un tono neutro/`--muted-foreground` para
   * series sin connotación positiva/negativa clara. */
  tone?: 'primary' | 'neutral';
  className?: string;
}

/**
 * Sparkline mínimo (regla de dataviz del Home admin): una sola línea fina de
 * 2px, sin ejes ni grid, un único color — la forma (tendencia) va primero,
 * el color al final. Sin librería de charting: un solo `<path>` inline.
 */
export function Sparkline({ values, tone = 'primary', className }: SparklineProps) {
  if (values.length < 2) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = WIDTH / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * step;
    // El SVG crece hacia abajo — se invierte para que "más alto" quede arriba.
    const y = HEIGHT - ((value - min) / range) * (HEIGHT - STROKE_WIDTH) - STROKE_WIDTH / 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const path = `M${points.join(' L')}`;

  return (
    <svg
      className={className ? `${styles.svg} ${className}` : styles.svg}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        className={tone === 'primary' ? styles.strokePrimary : styles.strokeNeutral}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
