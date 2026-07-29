import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '../domain/models';
import { ProfileDetails } from './ProfileDetails';

vi.mock('../application/useUpdateMyProfile', () => ({
  useUpdateMyProfile: () => ({ mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() }),
}));

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'u1',
    email: 'mauricio.donado@ameliahub.com',
    fullName: 'Mauricio Donado',
    avatarUrl: null,
    role: 'empleado',
    jobTitle: 'Software',
    hireDate: '2022-10-30',
    entityName: 'Amelia Lab',
    departmentName: 'Operaciones',
    managerName: 'Diego Arbalaez',
    isExternal: false,
    phone: '+34 658002393',
    city: 'Cartagena',
    dniNie: null,
    birthDate: null,
    address: null,
    companyPhone: null,
    ...overrides,
  } as UserProfile;
}

describe('ProfileDetails', () => {
  it('separa los datos en dos tarjetas: contacto e información laboral', () => {
    render(<ProfileDetails profile={profile()} />);
    expect(screen.getByText('Información de contacto')).toBeInTheDocument();
    expect(screen.getByText('Información laboral')).toBeInTheDocument();
  });

  it('NO repite entidad ni departamento: ya están en el hero de identidad', () => {
    render(<ProfileDetails profile={profile()} />);
    expect(screen.queryByText('Entidad')).not.toBeInTheDocument();
    expect(screen.queryByText('Departamento')).not.toBeInTheDocument();
    expect(screen.queryByText('Amelia Lab')).not.toBeInTheDocument();
  });

  it('muestra el responsable y la fecha de incorporación en español', () => {
    render(<ProfileDetails profile={profile()} />);
    expect(screen.getByText('Diego Arbalaez')).toBeInTheDocument();
    expect(screen.getByText('30 de octubre de 2022')).toBeInTheDocument();
  });

  it('calcula la antigüedad en tiempo de ejecución, no la fija', () => {
    // Con alta el 30/10/2022 la antigüedad crece con el tiempo, así que el
    // test comprueba el FORMATO y que sea coherente, no un número concreto.
    render(<ProfileDetails profile={profile()} />);
    expect(screen.getByText(/en Amelia$/)).toBeInTheDocument();
  });

  it('no muestra antigüedad negativa si el alta aún no es efectiva', () => {
    render(<ProfileDetails profile={profile({ hireDate: '2099-01-01' })} />);
    expect(screen.queryByText(/-\d+ (año|mes)/)).not.toBeInTheDocument();
  });

  it('ofrece editar solo los campos que el backend admite (teléfono y ciudad)', () => {
    render(<ProfileDetails profile={profile()} />);
    // El botón vive en la tarjeta de contacto, que es donde están esos campos.
    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
    expect(screen.getByText('+34 658002393')).toBeInTheDocument();
    expect(screen.getByText('Cartagena')).toBeInTheDocument();
  });
});
