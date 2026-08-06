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

  it('omite el manual que la página ya presenta por su cuenta (`excludeUrl`)', () => {
    // En Ayuda, el manual de uso de la intranet es la cabecera de la pantalla y
    // desde la migración 043 está también en la biblioteca: sin este filtro
    // aparecía DOS VECES en la misma página.
    const INTRANET_URL = '/manuales/manual-de-uso-intranet.pdf';
    mockHook({
      data: [
        manual(),
        manual({ id: 'doc-intranet', title: 'Manual de uso de la intranet', url: INTRANET_URL }),
      ],
    });
    render(<ManualsLibrary excludeUrl={INTRANET_URL} />);

    expect(screen.getByText('Manual de uso de ClickUp')).toBeInTheDocument();
    expect(screen.queryByText('Manual de uso de la intranet')).not.toBeInTheDocument();
  });

  it('excluye por URL y no por título, que el admin puede cambiar', () => {
    // `url` es `onboarding_documents.storage_ref`: la identidad del fichero. El
    // título es editable, así que filtrar por él dejaría de funcionar el día que
    // alguien lo renombre desde el panel.
    const INTRANET_URL = '/manuales/manual-de-uso-intranet.pdf';
    mockHook({
      data: [manual({ id: 'doc-intranet', title: 'Guía de la intranet (v2)', url: INTRANET_URL })],
    });
    render(<ManualsLibrary excludeUrl={INTRANET_URL} />);

    expect(screen.queryByText('Guía de la intranet (v2)')).not.toBeInTheDocument();
  });

  it('si el filtro deja la lista vacía NO dice que no haya ningún manual', () => {
    // Habría uno —el de la cabecera—, así que "no ha publicado ningún manual"
    // sería falso.
    const INTRANET_URL = '/manuales/manual-de-uso-intranet.pdf';
    mockHook({ data: [manual({ id: 'doc-intranet', url: INTRANET_URL })] });
    render(<ManualsLibrary excludeUrl={INTRANET_URL} />);

    expect(screen.getByText(/no hay más manuales que el de arriba/i)).toBeInTheDocument();
    expect(screen.queryByText(/todavía no ha publicado ningún manual/i)).not.toBeInTheDocument();
  });

  it('sin `excludeUrl` no filtra nada', () => {
    mockHook({
      data: [manual(), manual({ id: 'doc-intranet', title: 'Manual de uso de la intranet' })],
    });
    render(<ManualsLibrary />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
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
