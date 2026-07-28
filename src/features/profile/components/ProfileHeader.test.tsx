import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../domain/models';
import { ProfileHeader } from './ProfileHeader';

function buildProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    fullName: 'Marta Sánchez',
    email: 'marta@ameliahub.com',
    role: 'empleado',
    avatarUrl: null,
    jobTitle: 'Técnica de RRHH',
    hireDate: null,
    entityName: 'Amelia Hub',
    departmentName: 'Personas',
    managerName: null,
    isExternal: false,
    phone: null,
    city: null,
    ...overrides,
  };
}

// A11Y-1: el <h1> de la vista es el del Topbar (AppLayout) — el nombre de
// la persona aquí es contenido, no el rótulo de la página, así que debe
// bajar a <h2> para no duplicar el nivel 1 de encabezado.
describe('ProfileHeader — un solo <h1> por vista (A11Y-1)', () => {
  it('no emite un encabezado de nivel 1 (el <h1> de la vista es el del Topbar)', () => {
    render(<ProfileHeader profile={buildProfile()} />);

    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
  });

  it('muestra el nombre de la persona como encabezado de nivel 2', () => {
    render(<ProfileHeader profile={buildProfile()} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Marta Sánchez' })).toBeInTheDocument();
  });
});
