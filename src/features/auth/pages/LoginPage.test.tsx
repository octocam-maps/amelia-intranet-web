import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

function renderLoginPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    // El flujo real de Google Identity Services (One Tap + FedCM) no es
    // viable de testear en unit — necesita el script real de Google y un
    // navegador. Aquí solo verificamos que la página monta con el copy del
    // boceto y que cae al aviso de configuración cuando GIS no está
    // disponible (sin VITE_GOOGLE_CLIENT_ID, ni siquiera intenta cargar el
    // SDK). `vi.stubEnv` evita depender de lo que tenga el `.env` real.
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('monta con el copy del boceto y cae al aviso cuando falta configurar Google', () => {
    renderLoginPage();

    expect(screen.getByText('Hola de nuevo')).toBeInTheDocument();
    expect(screen.getByText('Bienvenido a tu espacio de trabajo.')).toBeInTheDocument();
    expect(screen.getByText(/Escribe a RRHH/i)).toBeInTheDocument();
    expect(screen.getByText(/Falta configurar/i)).toBeInTheDocument();
  });
});
