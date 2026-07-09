import { useEffect, useState } from 'react';

/**
 * Segundos transcurridos desde `sinceIso`, recalculados cada segundo con
 * `setInterval` — NO se pide al backend cada tick. Se ancla a un timestamp
 * real (`clock_in`) y se deja correr en el cliente; se congela en `frozen`
 * (p. ej. durante una pausa) sin perder el acumulado.
 */
export function useElapsedSeconds(sinceIso: string | null, frozen = false): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!sinceIso || frozen) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [sinceIso, frozen]);

  if (!sinceIso) return 0;
  const since = new Date(sinceIso).getTime();
  return Math.max(0, Math.floor((now - since) / 1000));
}

/** `HH:MM:SS`, siempre con ceros a la izquierda — formato del cronómetro
 * de la tarjeta de fichaje y del pill del topbar. */
export function formatHms(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}
