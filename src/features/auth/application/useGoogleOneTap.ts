import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/lib/google/google-identity.d.ts';
import { useLoginWithGoogle } from './useLoginWithGoogle';

export type GoogleAuthStage = 'checking' | 'awaiting-action' | 'authenticating';

/**
 * Login híbrido de Google (Identity Services):
 * 1. Al montar, intenta One Tap con `auto_select` — si el usuario ya dio su
 *    consentimiento y tiene una única sesión de Google activa, entra SIN
 *    clic.
 * 2. Si Google no puede mostrar el prompt (bloqueado, sin sesión, varias
 *    cuentas, ya descartado antes...), cae al botón oficial de Google como
 *    respaldo visible, renderizado en `buttonContainerRef`.
 *
 * Ambos caminos comparten el mismo `callback` de Google, así que terminan
 * en el mismo `POST /auth/login` vía `useLoginWithGoogle` — no hay dos
 * flujos de auth, solo dos formas de disparar el mismo credential.
 */
export function useGoogleOneTap() {
  const navigate = useNavigate();
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<GoogleAuthStage>('checking');
  const { mutate, isError } = useLoginWithGoogle();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setStage('awaiting-action');
      return;
    }

    let cancelled = false;

    const handleCredential = (response: { credential: string }) => {
      if (cancelled) return;
      setStage('authenticating');
      mutate(response.credential, {
        onSuccess: () => navigate('/', { replace: true }),
        onError: () => {
          if (!cancelled) setStage('awaiting-action');
        },
      });
    };

    const renderFallbackButton = () => {
      if (cancelled || !window.google || !buttonContainerRef.current) return;
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        locale: 'es',
        width: 320,
      });
      setStage('awaiting-action');
    };

    const tryInit = () => {
      if (cancelled) return;
      if (!window.google) {
        requestAnimationFrame(tryInit);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredential,
        auto_select: true,
        use_fedcm_for_prompt: true,
      });

      window.google.accounts.id.prompt((notification) => {
        if (cancelled) return;
        const oneTapUnavailable =
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment();
        if (oneTapUnavailable) {
          renderFallbackButton();
        }
        // Si SÍ se muestra y auto-selecciona, Google llama a
        // `handleCredential` directamente — no hace falta nada más aquí.
      });
    };

    tryInit();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    stage,
    isError,
    isConfigured: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
    buttonContainerRef,
  };
}
