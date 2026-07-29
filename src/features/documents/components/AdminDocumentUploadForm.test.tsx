import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/http/api-client';
import { useStaffList } from '@/features/staff/application/useStaffList';
import { useUploadDocument } from '../application/useUploadDocument';
import { AdminDocumentUploadForm } from './AdminDocumentUploadForm';

vi.mock('../application/useUploadDocument', () => ({ useUploadDocument: vi.fn() }));
vi.mock('@/features/staff/application/useStaffList', () => ({ useStaffList: vi.fn() }));

/**
 * El `Select` de Radix no se puede abrir en jsdom: depende de eventos de puntero
 * y de mediciones de layout que el entorno no implementa. Se sustituye por un
 * `<select>` nativo con la misma interfaz — lo que se audita aquí es el manejo
 * del error de subida, no el desplegable, que tiene su propia cobertura en
 * Radix. Primer test del repo que lo necesita; si aparece otro, esto se
 * extrae a `src/test/`.
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
      <option value="" />
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

const upload = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useUploadDocument).mockReturnValue({
    mutateAsync: upload,
  } as unknown as ReturnType<typeof useUploadDocument>);
  // `useStaffList` devuelve `{ members }`, no un array — con un array suelto el
  // selector se queda sin opciones y la validación corta antes de llegar a la
  // subida, que es lo que se quiere probar.
  vi.mocked(useStaffList).mockReturnValue({
    data: {
      members: [{ id: 'user-1', fullName: 'Mauricio Donado', email: 'mauricio@ameliahub.com' }],
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useStaffList>);
});

/** Rellena el mínimo para poder enviar: empleado (primer `select` del
 *  formulario, es el primer campo) y un PDF. */
function rellenarFormulario(nombreArchivo: string) {
  const selects = screen.getAllByRole('combobox');
  fireEvent.change(selects[0]!, { target: { value: 'user-1' } });

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['%PDF-1.4'], nombreArchivo, { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [file] } });
}

/**
 * El `catch` del bucle de subida NO capturaba el error: era `catch {}` sin
 * variable. Descartaba el mensaje real del backend —que el adaptador sí parsea
 * bien— y lo sustituía por una conjetura ("Revisa que sean PDF y no superen el
 * límite") que puede ser falsa. Un 409 «el período ya tiene una nómina subida»
 * se anunciaba como un problema de formato o de tamaño, y quien lo leyera
 * volvería a intentar lo mismo esperando otro resultado.
 *
 * `AdminDocumentsPage` (sincronización con Drive) sí muestra el error real: era
 * la misma feature contradiciéndose entre dos ramas.
 */
describe('AdminDocumentUploadForm — el motivo del fallo es el del backend', () => {
  it('muestra el mensaje real del 409, no la conjetura de formato', async () => {
    upload.mockRejectedValue(new ApiError('El período ya tiene una nómina subida.', 409));

    render(<AdminDocumentUploadForm onSaved={vi.fn()} onCancel={vi.fn()} />);
    rellenarFormulario('nomina-julio.pdf');
    fireEvent.click(screen.getByRole('button', { name: /subir/i }));

    await waitFor(() => {
      expect(screen.getByText(/El período ya tiene una nómina subida\./)).toBeInTheDocument();
    });
    expect(screen.queryByText(/no superen el límite/i)).not.toBeInTheDocument();
  });

  it('nombra el archivo junto a su motivo', async () => {
    upload.mockRejectedValue(new ApiError('Formato no admitido.', 415));

    render(<AdminDocumentUploadForm onSaved={vi.fn()} onCancel={vi.fn()} />);
    rellenarFormulario('contrato.pdf');
    fireEvent.click(screen.getByRole('button', { name: /subir/i }));

    await waitFor(() => {
      const error = screen.getByText(/Formato no admitido\./);
      expect(error.textContent).toMatch(/contrato\.pdf/);
    });
  });

  it('no llama a onSaved si algo falló', async () => {
    const onSaved = vi.fn();
    upload.mockRejectedValue(new ApiError('Cualquier cosa.', 500));

    render(<AdminDocumentUploadForm onSaved={onSaved} onCancel={vi.fn()} />);
    rellenarFormulario('x.pdf');
    fireEvent.click(screen.getByRole('button', { name: /subir/i }));

    await waitFor(() => expect(screen.getByText(/Cualquier cosa\./)).toBeInTheDocument());
    expect(onSaved).not.toHaveBeenCalled();
  });
});
