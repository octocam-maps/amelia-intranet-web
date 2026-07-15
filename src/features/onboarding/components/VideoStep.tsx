import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import hincatorVideo from '@/assets/videos/hincator.mp4';
import { useReportVideoProgress } from '../application/useReportVideoProgress';
import type { OnboardingStep, VideoStepConfig } from '../domain/models';
import styles from './VideoStep.module.css';

// Cada cuánto se reporta progreso mientras el vídeo está en reproducción.
// Con el asset actual (~96s) esto manda ~el 5% de avance por report, muy
// por debajo del salto máximo que el backend acepta de una vez.
const REPORT_INTERVAL_MS = 5_000;
// Margen de tolerancia al comparar `currentTime` con `maxWatched` en
// `onSeeking` — evita revertir por el jitter normal del <video>.
const SEEK_EPSILON_SECONDS = 0.5;

interface VideoStepProps {
  step: OnboardingStep;
}

/**
 * Opción A del vídeo no-skippable: el navegador SÍ permite mover la barra,
 * así que no bloqueamos el control — dejamos que el usuario arrastre y en
 * `onSeeking` revertimos si aterriza más allá de `maxWatched`. Retroceder
 * siempre está permitido (repasar). El progreso reportado es monotónico
 * (`maxWatched`, nunca `currentTime` a secas) para que un `seek` hacia atrás
 * no haga bajar el `progress_pct` ya confirmado por el backend.
 */
export function VideoStep({ step }: VideoStepProps) {
  const config = step.config as VideoStepConfig;
  const videoRef = useRef<HTMLVideoElement>(null);
  const maxWatchedRef = useRef(0);
  const lastReportedPctRef = useRef(0);
  const { mutate: reportProgress } = useReportVideoProgress();

  const isCompleted = step.status === 'completed';
  const isLocked = step.status === 'locked';
  const [displayPct, setDisplayPct] = useState(step.progressPct);

  const sendProgress = useCallback(
    (currentTime: number, duration: number, force = false) => {
      if (!duration) return;
      const pct = Math.min(100, Math.floor((currentTime / duration) * 100));
      if (pct <= lastReportedPctRef.current && !force) return;
      lastReportedPctRef.current = pct;
      setDisplayPct(pct);
      reportProgress({ stepId: step.id, progressPct: pct });
    },
    [reportProgress, step.id]
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || isCompleted || isLocked) return;

    // Los handlers leen el elemento desde `event.currentTarget` (no desde el
    // `videoEl` capturado arriba): así TS no necesita seguir narrowing la
    // referencia a través de closures, y seguimos protegidos si el ref
    // cambiase durante el ciclo de vida del efecto.
    function handleLoadedMetadata(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      const duration = el.duration || config.duration || 0;
      // Retoma desde donde el backend dejó el progreso — el `maxWatched`
      // local arranca ahí, no en 0, para no permitir "retroceder el
      // candado" solo recargando la página.
      const resumeAt = (step.progressPct / 100) * duration;
      if (resumeAt > 0 && resumeAt < duration) {
        el.currentTime = resumeAt;
        maxWatchedRef.current = resumeAt;
      }
      lastReportedPctRef.current = step.progressPct;
    }

    function handleTimeUpdate(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      if (el.currentTime > maxWatchedRef.current) {
        maxWatchedRef.current = el.currentTime;
      }
    }

    function handleSeeking(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      if (el.currentTime > maxWatchedRef.current + SEEK_EPSILON_SECONDS) {
        el.currentTime = maxWatchedRef.current;
      }
    }

    function handlePause(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      sendProgress(maxWatchedRef.current, el.duration || config.duration, true);
    }

    function handleEnded(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      maxWatchedRef.current = el.duration || config.duration;
      sendProgress(maxWatchedRef.current, el.duration || config.duration, true);
    }

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('seeking', handleSeeking);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('ended', handleEnded);

    const intervalId = window.setInterval(() => {
      const el = videoRef.current;
      if (el && !el.paused && !el.ended) {
        sendProgress(maxWatchedRef.current, el.duration || config.duration);
      }
    }, REPORT_INTERVAL_MS);

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('seeking', handleSeeking);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('ended', handleEnded);
      window.clearInterval(intervalId);
    };
  }, [config.duration, isCompleted, isLocked, sendProgress, step.progressPct]);

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <p className={styles.subtitle}>
        {isCompleted
          ? 'Has visto el vídeo completo. Ya puedes pasar al siguiente paso.'
          : 'Míralo entero para conocer quiénes somos. No podrás adelantarlo más allá de lo que ya has visto.'}
      </p>

      <div className={styles.playerWrapper}>
        <span className={styles.lockBadge}>
          <Lock className={styles.lockIcon} />
          No se puede adelantar
        </span>
        {isCompleted ? (
          <div className={styles.completedOverlay}>
            <CheckCircle2 className={styles.completedIcon} />
            <span className={styles.completedLabel}>Vídeo completado</span>
          </div>
        ) : null}
        <video ref={videoRef} className={styles.video} src={hincatorVideo} controls playsInline />
      </div>

      <div className={styles.footer}>
        {isCompleted ? (
          <span className={styles.footerHint}>
            <CheckCircle2 className={styles.footerHintIcon} />
            ¡Buen comienzo! Paso 1 completado
          </span>
        ) : (
          <span className={styles.footerHint}>
            <Lock className={styles.footerHintIcon} />
            Termina el vídeo para desbloquear el siguiente paso · {displayPct}%
          </span>
        )}
      </div>
    </div>
  );
}
