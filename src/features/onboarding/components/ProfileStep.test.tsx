import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDepartments } from '@/features/departments/application/useDepartments';
import { useCompleteProfile } from '../application/useCompleteProfile';
import type { OnboardingStep } from '../domain/models';
import { ProfileStep } from './ProfileStep';

vi.mock('../application/useCompleteProfile', () => ({ useCompleteProfile: vi.fn() }));
vi.mock('@/features/departments/application/useDepartments', () => ({ useDepartments: vi.fn() }));
/**
 * El `Select` de Radix no se puede abrir en jsdom (`scrollIntoView` no existe
 * ahí), así que se sustituye por un `<select>` nativo con la misma interfaz —
 * mismo patrón que `StaffForm.test.tsx` y `AdminDocumentUploadForm.test.tsx`.
 * Lo que se prueba aquí es la ETIQUETA de cada opción, y para eso el
 * desplegable real no aporta nada.
 */
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: ReactNode;
  }) => (
    <select value={value} onChange={(event) => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  // Catálogo 2026: el selector agrupa `Software`/`Hardware` bajo `Producto`.
  // En el mock se representan con `<optgroup>` porque es el equivalente nativo
  // del `<select>` que sustituye a Radix aquí, y así el encabezado sigue
  // siendo consultable desde los tests.
  SelectGroup: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectLabel: ({ children }: { children: ReactNode }) => <optgroup label={String(children)} />,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
}));


function buildStep(overrides: Partial<OnboardingStep> = {}): OnboardingStep {
  return {
    // Paso 4 desde la reordenación de v1.1 — era el 5 y el último.
    id: 'step-4',
    stepOrder: 4,
    type: 'profile',
    title: 'Completa tu perfil',
    config: {},
    status: 'available',
    progressPct: 0,
    data: null,
    startedAt: null,
    completedAt: null,
    documents: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCompleteProfile).mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  } as unknown as ReturnType<typeof useCompleteProfile>);
  vi.mocked(useDepartments).mockReturnValue({
    data: [{ id: 'dept-1', name: 'Operaciones' }],
    isLoading: false,
  } as unknown as ReturnType<typeof useDepartments>);
});

// Este fichero no existía, y por eso nadie vio que el copy quedó caducado con
// la reordenación del onboarding (migración 033): el perfil pasó de ser el 5º
// y último al 4º, con la documentación firmada detrás.
describe('ProfileStep — el perfil YA NO es el último paso', () => {
  it('no se anuncia como último paso', () => {
    render(<ProfileStep step={buildStep()} />);

    // Ojo con la trampa: "Penúltimo paso" CONTIENE "último paso", así que un
    // `/último paso/i` a secas da un falso positivo. Hay que anclar al inicio
    // del texto del propio subtítulo.
    const subtitulo = screen.getByText(/paso\. Todos los campos/i);

    expect(subtitulo.textContent).toMatch(/^Penúltimo paso\./);
    expect(subtitulo.textContent).not.toMatch(/^Último paso/);
  });

  it('el botón no promete finalizar el onboarding', () => {
    // Enviar este formulario NO cierra el onboarding: desbloquea el paso 5.
    render(<ProfileStep step={buildStep()} />);

    expect(screen.queryByRole('button', { name: /finalizar onboarding/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar perfil/i })).toBeInTheDocument();
  });

  it('al completarlo remite al paso que queda, no da el onboarding por hecho', () => {
    render(<ProfileStep step={buildStep({ status: 'completed' })} />);

    expect(screen.getByText(/perfil completado/i)).toBeInTheDocument();
    expect(screen.getByText(/documentación firmada/i)).toBeInTheDocument();
    // "Ya formas parte del equipo" daba el flujo por terminado.
    expect(screen.queryByText(/ya formas parte del equipo/i)).not.toBeInTheDocument();
  });
});

// El selector mostraba cuatro «Administración» seguidas e indistinguibles: los
// mismos departamentos existen en las cuatro sociedades del grupo. Ahora
// `GET /departments` filtra por la entidad de quien pregunta, y la etiqueta con
// la sociedad queda como red para el caso que el backend no puede filtrar (un
// usuario sin entidad asignada, al que se le muestran todas).
describe('ProfileStep — selector de departamento', () => {
  function mockDepartments(data: unknown[]) {
    vi.mocked(useDepartments).mockReturnValue({
      data,
      isLoading: false,
    } as unknown as ReturnType<typeof useDepartments>);
  }

  it('no añade la sociedad cuando los nombres NO se repiten', () => {
    // El caso normal desde que el backend filtra: sería ruido, porque todas las
    // opciones son de la misma sociedad y el sufijo no distingue nada.
    mockDepartments([
      { id: 'd1', name: 'Administración', entityId: 'e-hub', entityCode: 'hub' },
      { id: 'd2', name: 'Comercial', entityId: 'e-hub', entityCode: 'hub' },
    ]);
    render(<ProfileStep step={buildStep()} />);

    expect(screen.getByText('Administración')).toBeInTheDocument();
    expect(screen.queryByText(/Administración · /)).not.toBeInTheDocument();
  });

  it('añade la sociedad SOLO a los nombres repetidos', () => {
    mockDepartments([
      { id: 'd1', name: 'Administración', entityId: 'e-hub', entityCode: 'hub' },
      { id: 'd2', name: 'Administración', entityId: 'e-lab', entityCode: 'lab' },
      { id: 'd3', name: 'Comercial', entityId: 'e-hub', entityCode: 'hub' },
    ]);
    render(<ProfileStep step={buildStep()} />);

    // Las dos ambiguas quedan distinguibles…
    expect(screen.getByText('Administración · Hub')).toBeInTheDocument();
    expect(screen.getByText('Administración · Lab')).toBeInTheDocument();
    // …y la que no lo era se queda limpia.
    expect(screen.getByText('Comercial')).toBeInTheDocument();
  });

  it('usa la etiqueta corta y no el nombre comercial largo', () => {
    // En un desplegable el prefijo «Amelia» se repetiría en todas las opciones.
    mockDepartments([
      { id: 'd1', name: 'Administración', entityId: 'e-hub', entityCode: 'hub' },
      { id: 'd2', name: 'Administración', entityId: 'e-lab', entityCode: 'lab' },
    ]);
    render(<ProfileStep step={buildStep()} />);

    expect(screen.getByText('Administración · Hub')).toBeInTheDocument();
    expect(screen.queryByText(/Amelia Hub/)).not.toBeInTheDocument();
  });

  it('cae al nombre a secas si el departamento no trae sociedad', () => {
    // `entityCode` puede venir null: el JOIN del repositorio es LEFT. Mejor una
    // opción ambigua que una etiqueta con un hueco o un «undefined».
    mockDepartments([
      { id: 'd1', name: 'Administración', entityId: 'e-1', entityCode: null },
      { id: 'd2', name: 'Administración', entityId: 'e-2', entityCode: null },
    ]);
    render(<ProfileStep step={buildStep()} />);

    expect(screen.getAllByText('Administración').length).toBe(2);
    expect(screen.queryByText(/·\s*$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });
});
