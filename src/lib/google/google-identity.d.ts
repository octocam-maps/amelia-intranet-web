export {};

/** Tipado mínimo de Google Identity Services (cargado por <script> en index.html). */
declare global {
  interface PromptMomentNotification {
    isDisplayed: () => boolean;
    isNotDisplayed: () => boolean;
    getNotDisplayedReason: () => string;
    isSkippedMoment: () => boolean;
    getSkippedReason: () => string;
    isDismissedMoment: () => boolean;
    getDismissedReason: () => string;
  }

  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            /** Auto-selecciona la cuenta si el usuario ya dio su consentimiento y solo tiene una sesión de Google — entra sin clic. */
            auto_select?: boolean;
            /** Migra el prompt de One Tap al estándar FedCM del navegador (recomendado por Google, evita depender de cookies de terceros). */
            use_fedcm_for_prompt?: boolean;
          }) => void;
          /** Dispara el prompt de One Tap. El listener informa si NO se pudo mostrar (para caer al botón de respaldo). */
          prompt: (momentListener?: (notification: PromptMomentNotification) => void) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}
