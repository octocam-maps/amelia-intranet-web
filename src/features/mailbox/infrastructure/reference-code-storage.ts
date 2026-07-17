/**
 * Persistencia local del `reference_code` en el navegador de quien envía un
 * mensaje anónimo — es su único "recibo" para poder consultar la respuesta
 * más tarde (no hay email, notificación ni sesión que lo recuerde por él).
 *
 * Esto NO es lo mismo que el `access_token` de auth (ese vive solo en
 * memoria por regla del proyecto — ver `useAuthBootstrap`): un
 * `reference_code` no identifica a nadie, es la credencial de un mensaje
 * concreto y anónimo, así que guardarlo en `localStorage` no reabre ese
 * problema.
 */
const STORAGE_KEY = 'amelia.mailbox.lastReferenceCode';

export function saveLastReferenceCode(referenceCode: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, referenceCode);
  } catch {
    // Modo privado, cuota agotada, etc. — perder el recibo no es crítico,
    // el emisor siempre puede copiar el código a mano.
  }
}

export function getLastReferenceCode(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
