import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '@/lib/google/google-identity.d.ts';
import { useLoginWithGoogle } from '../application/useLoginWithGoogle';

/** Botón "Iniciar sesión con Google" (Google Identity Services, sin redirect OAuth). */
export function GoogleSignInButton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { mutate, isPending, isError } = useLoginWithGoogle();

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    let cancelled = false;

    // El script de Google se carga async/defer: puede no estar listo todavía
    // cuando este efecto corre, así que reintentamos hasta que aparezca.
    const tryInit = () => {
      if (cancelled) return;
      if (!window.google || !containerRef.current) {
        requestAnimationFrame(tryInit);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          mutate(response.credential, {
            onSuccess: () => navigate('/', { replace: true }),
          });
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        locale: 'es',
      });
    };

    tryInit();
    return () => {
      cancelled = true;
    };
  }, [mutate, navigate]);

  const clientIdMissing = !import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <div className="flex flex-col items-center gap-3">
      <div ref={containerRef} />
      {clientIdMissing && (
        <p className="text-sm text-warning">
          Falta configurar <code>VITE_GOOGLE_CLIENT_ID</code> en el entorno.
        </p>
      )}
      {isPending && <p className="text-sm text-muted-foreground">Iniciando sesión…</p>}
      {isError && (
        <p className="text-sm text-destructive">
          No se pudo iniciar sesión. Inténtalo de nuevo o contacta con RRHH.
        </p>
      )}
    </div>
  );
}
