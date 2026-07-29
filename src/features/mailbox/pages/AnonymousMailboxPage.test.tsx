import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { pageTitleForPath } from '@/layouts/AppLayout/nav-config';
import { AnonymousMailboxPage } from './AnonymousMailboxPage';

// El formulario trae TanStack Query y react-router por dentro; aquí solo se
// audita el rótulo de la tarjeta, así que se sustituye por un hueco.
vi.mock('../components/AnonymousMailboxForm', () => ({
  AnonymousMailboxForm: () => <div data-testid="formulario" />,
}));

/**
 * El Topbar ya imprime el label del ítem de navegación como `<h1>`
 * (`pageTitleForPath`), y esta tarjeta repetía ese mismo texto palabra por
 * palabra. El patrón correcto lo marca la página hermana de seguimiento:
 * su rótulo ("Seguimiento de tu mensaje") añade QUÉ estás haciendo, no
 * reimprime DÓNDE estás.
 */
describe('AnonymousMailboxPage — no repite el rótulo del Topbar', () => {
  it('la tarjeta no reimprime el label de navegación', () => {
    const tituloDelTopbar = pageTitleForPath('/buzon-anonimo', 'empleado');
    expect(tituloDelTopbar).toBe('Buzón anónimo');

    render(<AnonymousMailboxPage />);

    expect(screen.queryByText(tituloDelTopbar)).not.toBeInTheDocument();
  });

  it('el rótulo dice qué se hace aquí', () => {
    render(<AnonymousMailboxPage />);

    expect(screen.getByText('Nuevo mensaje')).toBeInTheDocument();
  });
});
