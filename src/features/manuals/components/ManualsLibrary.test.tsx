import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useManuals } from '../application/useManuals';
import type { Manual } from '../domain/models';
import { ManualsLibrary } from './ManualsLibrary';

vi.mock('../application/useManuals', () => ({ useManuals: vi.fn() }));

function manual(overrides: Partial<Manual> = {}): Manual {
  return {
    id: 'doc-clickup',
    title: 'Manual de uso de ClickUp',
    version: 1,
    url: '/manuales/manual-clickup-2026-ES.pdf',
    requiredInOnboarding: true,
    acknowledged: false,
    ...overrides,
  };
}

function mockHook({ data = [manual()], isLoading = false, isError = false } = {}) {
  vi.mocked(useManuals).mockReturnValue({
    data,
    isLoading,
    isError,
  } as unknown as ReturnType<typeof useManuals>);
}

describe('ManualsLibrary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ofrece abrir y descargar cada manual', () => {
    mockHook();
    render(<ManualsLibrary />);

    expect(screen.getByRole('link', { name: /abrir/i })).toHaveAttribute(
      'href',
      '/manuales/manual-clickup-2026-ES.pdf'
    );
    expect(screen.getByRole('link', { name: /descargar/i })).toHaveAttribute('download');
  });

  it('NO bloquea ningún manual, ni con la lectura pendiente', () => {
    // La cascada aplica dentro del paso 3 del onboarding. Bloquear aquí un PDF que
    // alguien necesita para trabajar no protegería nada.
    mockHook({
      data: [
        manual(),
        manual({ id: 'doc-hincator', title: 'Manual Hincator', acknowledged: false }),
      ],
    });
    render(<ManualsLibrary />);

    expect(screen.getAllByRole('link', { name: /abrir/i })).toHaveLength(2);
    expect(screen.queryByText(/se desbloquea/i)).not.toBeInTheDocument();
  });

  it('distingue lectura obligatoria de documento de consulta', () => {
    mockHook({
      data: [
        manual(),
        manual({
          id: 'doc-intranet',
          title: 'Manual de uso de la intranet',
          requiredInOnboarding: false,
        }),
      ],
    });
    render(<ManualsLibrary />);

    expect(screen.getByText(/Lectura obligatoria · pendiente/i)).toBeInTheDocument();
    expect(screen.getByText('Documento de consulta')).toBeInTheDocument();
  });

  it('dice cuándo ya confirmaste la lectura', () => {
    // Le sirve para saber qué le queda pendiente de su onboarding.
    mockHook({ data: [manual({ acknowledged: true })] });
    render(<ManualsLibrary />);

    expect(screen.getByText(/Lectura confirmada en tu onboarding/i)).toBeInTheDocument();
  });

  it('un manual registrado sin fichero lo dice, no deja un enlace muerto', () => {
    mockHook({ data: [manual({ url: null })] });
    render(<ManualsLibrary />);

    expect(screen.getByText('Sin publicar')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /abrir/i })).not.toBeInTheDocument();
  });

  it('respeta el orden del backend (obligatorios primero)', () => {
    mockHook({
      data: [
        manual({ id: 'a', title: 'Obligatorio', requiredInOnboarding: true }),
        manual({ id: 'b', title: 'De consulta', requiredInOnboarding: false }),
      ],
    });
    render(<ManualsLibrary />);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Obligatorio');
    expect(items[1]).toHaveTextContent('De consulta');
  });

  it('distingue cargando, error y catálogo vacío', () => {
    mockHook({ data: [], isLoading: true });
    const { rerender } = render(<ManualsLibrary />);
    expect(screen.getByText(/Cargando los manuales/i)).toBeInTheDocument();

    mockHook({ data: [], isError: true });
    rerender(<ManualsLibrary />);
    expect(screen.getByText(/No se han podido cargar/i)).toBeInTheDocument();

    mockHook({ data: [] });
    rerender(<ManualsLibrary />);
    expect(screen.getByText(/todavía no ha publicado ningún manual/i)).toBeInTheDocument();
  });
});
