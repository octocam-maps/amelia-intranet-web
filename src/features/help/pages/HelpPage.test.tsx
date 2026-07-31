import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useManuals } from '@/features/manuals/application/useManuals';
import { NAV_BY_ROLE } from '@/layouts/AppLayout/nav-config';
import { HelpPage } from './HelpPage';

// La página monta la biblioteca de manuales (`GET /manuals`, migración backend
// 043), que es una query de React Query — se mockea para que estos tests sigan
// probando la Ayuda y no el fetch.
vi.mock('@/features/manuals/application/useManuals', () => ({ useManuals: vi.fn() }));

beforeEach(() => {
  vi.mocked(useManuals).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useManuals>);
});

describe('HelpPage', () => {
  it('sirve el manual con enlaces, NO en un iframe', () => {
    // Mismo motivo que en `TeamOrgChart`: la CSP de producción declara
    // `frame-src https://accounts.google.com` (sin `'self'`) y
    // `object-src 'none'`, así que un iframe con el manual funcionaría hoy
    // (la cabecera va en Report-Only) y se rompería EN SILENCIO al pasarla a
    // enforcing — la Ayuda quedaría en blanco sin error visible. Este test es
    // la guarda de esa decisión.
    const { container } = render(<HelpPage />);

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('embed')).toBeNull();
    expect(container.querySelector('object')).toBeNull();
  });

  it('ofrece el manual completo y su descarga en PDF', () => {
    render(<HelpPage />);

    expect(screen.getByRole('link', { name: /abrir el manual completo/i })).toHaveAttribute(
      'href',
      '/ayuda/manual-de-uso.html'
    );
    const pdf = screen.getByRole('link', { name: /descargar en pdf/i });
    // En `/manuales/` y no en `/ayuda/`: es la ruta que ya usa
    // `onboarding_documents.storage_ref` (migración 035), para poder
    // referenciarlo desde el paso 3 sin mover el fichero ni cambiar su hash.
    expect(pdf).toHaveAttribute('href', '/manuales/manual-de-uso-intranet.pdf');
    expect(pdf).toHaveAttribute('download');
  });

  it('enlaza los 14 capítulos a su ancla del manual', () => {
    // El valor de esta página es caer en el capítulo concreto: si los anclajes
    // se rompen, el usuario aterriza en la portada de un documento de 30
    // páginas y la Ayuda deja de ayudar.
    render(<HelpPage />);

    const anchors = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
      .filter((href): href is string => !!href?.includes('manual-de-uso.html#'));

    expect(anchors).toHaveLength(14);
    expect(anchors).toEqual(
      Array.from({ length: 14 }, (_, i) => `/ayuda/manual-de-uso.html#c${i + 1}`)
    );
  });

  it('no repite el título "Ayuda" que ya imprime el Topbar', () => {
    // `pageTitleForPath` ya renderiza el label del navbar como `<h1>`; repetirlo
    // aquí duplicaría el encabezado (hallazgo de la auditoría de UI del
    // 2026-07-29, mismo criterio que `AnonymousMailboxPage`).
    render(<HelpPage />);

    expect(screen.queryByRole('heading', { name: /^ayuda$/i })).toBeNull();
  });

  it('está en el navbar de los cinco roles', () => {
    // El manual explica también el onboarding recortado del externo-invitado:
    // es el único módulo del que ningún rol debe quedar fuera.
    const roles = Object.keys(NAV_BY_ROLE) as (keyof typeof NAV_BY_ROLE)[];

    expect(roles).toHaveLength(5);
    for (const role of roles) {
      expect(NAV_BY_ROLE[role].some((item) => item.to === '/ayuda')).toBe(true);
    }
  });
});
