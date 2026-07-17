import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircledIcon, LockClosedIcon, PlayIcon } from '@radix-ui/react-icons';
import hincatorVideo from '@/assets/videos/hincator.mp4';
import { useReportVideoProgress } from '../application/useReportVideoProgress';
import type { OnboardingStep, VideoStepConfig } from '../domain/models';
import styles from './VideoStep.module.css';

// Cada cuánto se reporta progreso al backend mientras el vídeo reproduce.
// Con el asset actual (~96s) esto manda ~5% de avance por report, muy por
// debajo del salto máximo que el backend acepta de una vez.
const REPORT_INTERVAL_MS = 5_000;
// Margen al comparar `currentTime` con `maxWatched` en `onSeeking` — evita
// revertir por el jitter normal del <video>.
const SEEK_EPSILON_SECONDS = 0.5;
// Único ritmo de reproducción permitido. Sin esto, `handleTimeUpdate` avanza
// `maxWatchedRef` con cualquier `currentTime` creciente — así que forzar
// `video.playbackRate = 16` desde DevTools "ve" el vídeo completo en una
// fracción del tiempo real y completa el paso sin haberlo mirado. No hay UI
// propia para cambiar el ritmo, pero eso no bloquea tocar la propiedad
// directamente desde la consola.
const ENFORCED_PLAYBACK_RATE = 1;

interface VideoStepProps {
  step: OnboardingStep;
}

/**
 * Vídeo no-skippable (Opción A del requerimiento, reforzada).
 *
 * En vez de dejar los `controls` nativos y revertir el salto *después* en
 * `onSeeking` (que producía un glitch: el <video> ya había saltado y
 * bufereado el frame adelantado antes de que revirtiéramos), NO exponemos
 * ninguna barra de scrubbing arrastrable:
 *   - `<video>` sin `controls` — el usuario no puede arrastrar ni clickear
 *     una barra que no existe. El adelanto es imposible por construcción.
 *   - Play/pausa es la única interacción (botón propio + click en el vídeo).
 *   - La barra de progreso es de SOLO LECTURA: refleja `maxWatched`, no
 *     acepta clicks. (Retroceder para repasar queda deshabilitado por ahora;
 *     es fácil de añadir permitiendo click solo a posiciones <= maxWatched.)
 *   - `onSeeking` se mantiene como RED DE SEGURIDAD (teclado, gestos) que
 *     revierte cualquier salto más allá de lo ya visto.
 *   - `playbackRate` se fija a 1 en `loadedmetadata` y se restaura en cada
 *     `ratechange`: sin esto, `video.playbackRate = 16` desde DevTools deja
 *     "ver" el vídeo completo en una fracción del tiempo real y completa el
 *     paso. La validación de fondo (tiempo reportado vs. tiempo real) la
 *     hace el backend en paralelo; esto solo cierra el vector obvio del
 *     cliente.
 *
 * El progreso reportado es monotónico (`maxWatched`, nunca `currentTime` a
 * secas) para que nada haga bajar el `progress_pct` ya confirmado por el
 * backend.
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
  const [isPlaying, setIsPlaying] = useState(false);

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

    function handleLoadedMetadata(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      el.playbackRate = ENFORCED_PLAYBACK_RATE;
      const duration = el.duration || config.duration || 0;
      // Retoma desde donde el backend dejó el progreso — el `maxWatched`
      // local arranca ahí, no en 0, para no permitir "retroceder el candado"
      // solo recargando la página.
      const resumeAt = (step.progressPct / 100) * duration;
      if (resumeAt > 0 && resumeAt < duration) {
        el.currentTime = resumeAt;
        maxWatchedRef.current = resumeAt;
      }
      lastReportedPctRef.current = step.progressPct;
      setDisplayPct(step.progressPct);
    }

    function handleTimeUpdate(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      if (el.currentTime > maxWatchedRef.current) {
        maxWatchedRef.current = el.currentTime;
      }
      const duration = el.duration || config.duration || 0;
      if (duration) {
        setDisplayPct(Math.min(100, Math.floor((maxWatchedRef.current / duration) * 100)));
      }
    }

    // Red de seguridad: sin `controls` no hay barra que arrastrar, pero por si
    // un seek llega por teclado/gesto, se revierte a lo ya visto.
    function handleSeeking(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      if (el.currentTime > maxWatchedRef.current + SEEK_EPSILON_SECONDS) {
        el.currentTime = maxWatchedRef.current;
      }
    }

    // Segunda red de seguridad: si algo cambia `playbackRate` (DevTools,
    // extensión, script en consola), lo restauramos en el propio evento que
    // dispara ese cambio — no hay forma de acelerar el vídeo y que se quede
    // acelerado. La validación de fondo (progreso reportado vs. tiempo real
    // transcurrido) la hace el backend; esto solo cierra el vector obvio.
    function handleRateChange(event: Event) {
      const el = event.currentTarget as HTMLVideoElement;
      if (el.playbackRate !== ENFORCED_PLAYBACK_RATE) {
        el.playbackRate = ENFORCED_PLAYBACK_RATE;
      }
    }

    function handlePlay() {
      setIsPlaying(true);
    }

    function handlePause(event: Event) {
      setIsPlaying(false);
      const el = event.currentTarget as HTMLVideoElement;
      sendProgress(maxWatchedRef.current, el.duration || config.duration, true);
    }

    function handleEnded(event: Event) {
      setIsPlaying(false);
      const el = event.currentTarget as HTMLVideoElement;
      maxWatchedRef.current = el.duration || config.duration;
      sendProgress(maxWatchedRef.current, el.duration || config.duration, true);
    }

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('seeking', handleSeeking);
    videoEl.addEventListener('ratechange', handleRateChange);
    videoEl.addEventListener('play', handlePlay);
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
      videoEl.removeEventListener('ratechange', handleRateChange);
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('ended', handleEnded);
      window.clearInterval(intervalId);
    };
  }, [config.duration, isCompleted, isLocked, sendProgress, step.progressPct]);

  const togglePlay = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
    } else {
      el.pause();
    }
  }, []);

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <p className={styles.subtitle}>
        {isCompleted
          ? 'Has visto el vídeo completo. Ya puedes pasar al siguiente paso.'
          : 'Míralo entero para conocer quiénes somos. No se puede adelantar: reprodúcelo hasta el final.'}
      </p>

      <div className={styles.playerWrapper}>
        <span className={styles.lockBadge}>
          <LockClosedIcon className={styles.lockIcon} />
          No se puede adelantar
        </span>

        {isCompleted ? (
          <div className={styles.completedOverlay}>
            <CheckCircledIcon className={styles.completedIcon} />
            <span className={styles.completedLabel}>Vídeo completado</span>
          </div>
        ) : null}

        {/* Sin `controls`: no hay barra de scrubbing arrastrable, así que
            adelantar es imposible. Play/pausa vía botón propio y click. */}
        <video
          ref={videoRef}
          className={styles.video}
          src={hincatorVideo}
          playsInline
          onClick={isCompleted ? undefined : togglePlay}
        />

        {/* El botón solo aparece cuando el vídeo está pausado (o sin
            arrancar): invita a reproducir sin tapar la imagen mientras corre.
            Para pausar durante la reproducción, se hace clic sobre el vídeo. */}
        {!isCompleted && !isPlaying ? (
          <button
            type="button"
            className={styles.playButton}
            onClick={togglePlay}
            aria-label="Reproducir vídeo"
          >
            <PlayIcon className={styles.playIcon} />
          </button>
        ) : null}

        {/* Barra de progreso de SOLO LECTURA — refleja lo visto, no acepta
            clicks ni arrastre (a diferencia de la barra nativa). */}
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayPct}
          aria-label="Progreso del vídeo"
        >
          <div className={styles.progressFill} style={{ width: `${displayPct}%` }} />
        </div>
      </div>

      <div className={styles.footer}>
        {isCompleted ? (
          <span className={styles.footerHint}>
            <CheckCircledIcon className={styles.footerHintIcon} />
            ¡Buen comienzo! Paso 1 completado
          </span>
        ) : (
          <span className={styles.footerHint}>
            <LockClosedIcon className={styles.footerHintIcon} />
            Termina el vídeo para desbloquear el siguiente paso · {displayPct}%
          </span>
        )}
      </div>
    </div>
  );
}
