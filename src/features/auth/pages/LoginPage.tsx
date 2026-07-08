import logoAmelia from '@/assets/brand/logo-amelia.png';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <img src={logoAmelia} alt="Amelia" className="mx-auto mb-6 h-10 w-auto" />
        <h1 className="mb-1 text-lg font-semibold text-foreground">Bienvenido a la intranet</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Inicia sesión con tu cuenta de Google corporativa para continuar.
        </p>
        <GoogleSignInButton />
      </div>
    </div>
  );
}
