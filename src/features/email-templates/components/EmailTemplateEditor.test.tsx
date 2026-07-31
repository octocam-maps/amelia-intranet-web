import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreviewEmailTemplate } from '../application/usePreviewEmailTemplate';
import { useRestoreEmailTemplate } from '../application/useRestoreEmailTemplate';
import { useUpdateEmailTemplate } from '../application/useUpdateEmailTemplate';
import type { EmailTemplate } from '../domain/models';
import { EmailTemplateEditor } from './EmailTemplateEditor';

vi.mock('../application/useUpdateEmailTemplate', () => ({ useUpdateEmailTemplate: vi.fn() }));
vi.mock('../application/useRestoreEmailTemplate', () => ({ useRestoreEmailTemplate: vi.fn() }));
vi.mock('../application/usePreviewEmailTemplate', () => ({ usePreviewEmailTemplate: vi.fn() }));

const PLACEHOLDERS = ['title', 'body', 'full_name', 'entity_name', 'job_title', 'url'];

function buildTemplate(overrides: Partial<EmailTemplate> = {}): EmailTemplate {
  return {
    templateKey: 'staff_invited',
    label: 'Bienvenida al dar de alta',
    description: 'Se envía a la persona recién dada de alta.',
    subject: 'Te damos la bienvenida a la intranet de Amelia',
    bodyHtml: '<p>Hola {{full_name}},</p>',
    isActive: true,
    updatedBy: null,
    updatedAt: null,
    ...overrides,
  };
}

const save = vi.fn();
const restore = vi.fn();
const preview = vi.fn();

function mockHooks({ previewResult = undefined } = {}) {
  vi.mocked(useUpdateEmailTemplate).mockReturnValue({
    mutate: save,
    isPending: false,
    error: null,
  } as unknown as ReturnType<typeof useUpdateEmailTemplate>);
  vi.mocked(useRestoreEmailTemplate).mockReturnValue({
    mutate: restore,
    isPending: false,
  } as unknown as ReturnType<typeof useRestoreEmailTemplate>);
  vi.mocked(usePreviewEmailTemplate).mockReturnValue({
    mutate: preview,
    data: previewResult,
    isPending: false,
  } as unknown as ReturnType<typeof usePreviewEmailTemplate>);
}

describe('EmailTemplateEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHooks();
  });

  it('explica cuándo se manda el correo, no solo su clave técnica', () => {
    // Sin la descripción, el admin tendría que adivinar qué dispara
    // `clock_out_missing`.
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    expect(screen.getByText('Bienvenida al dar de alta')).toBeInTheDocument();
    expect(screen.getByText(/recién dada de alta/i)).toBeInTheDocument();
    expect(screen.queryByText('staff_invited')).not.toBeInTheDocument();
  });

  it('distingue una plantilla editada de una que usa el texto por defecto', () => {
    const { rerender } = render(
      <EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />
    );
    expect(screen.getByText('Editada')).toBeInTheDocument();

    rerender(
      <EmailTemplateEditor
        template={buildTemplate({ isActive: false })}
        availablePlaceholders={PLACEHOLDERS}
      />
    );
    expect(screen.getByText('Texto por defecto')).toBeInTheDocument();
  });

  it('muestra los placeholders que manda el backend, no una lista propia', () => {
    // La lista blanca real vive en `render_placeholders`; duplicarla aquí la
    // habría desincronizado en el primer placeholder que se añadiera.
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    expect(screen.getByText('{{full_name}}')).toBeInTheDocument();
    expect(screen.getByText('{{job_title}}')).toBeInTheDocument();
  });

  it('no deja guardar si no se ha cambiado nada', () => {
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('no deja guardar un asunto vacío', () => {
    // El backend también lo rechaza, pero dejar el botón activo para recibir un
    // 422 es peor experiencia que no ofrecerlo.
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: '   ' } });

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  it('guarda el asunto y el cuerpo editados', () => {
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Nuevo asunto' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(save).toHaveBeenCalledWith({
      templateKey: 'staff_invited',
      input: { subject: 'Nuevo asunto', bodyHtml: '<p>Hola {{full_name}},</p>' },
    });
  });

  it('previsualiza el BORRADOR, no lo guardado', () => {
    // Es lo que evita que el admin descubra una errata cuando el correo ya salió
    // a toda la plantilla.
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    fireEvent.change(screen.getByLabelText('Asunto'), { target: { value: 'Borrador' } });
    fireEvent.click(screen.getByRole('button', { name: 'Previsualizar' }));

    expect(preview).toHaveBeenCalledWith({
      templateKey: 'staff_invited',
      draft: { subject: 'Borrador', bodyHtml: '<p>Hola {{full_name}},</p>' },
    });
  });

  it('la previsualización avisa de que no se ha enviado nada', () => {
    mockHooks({
      previewResult: { subject: 'Hola Ana Ejemplo', html: '<html><body>ok</body></html>' },
    });
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    expect(screen.getByText(/Hola Ana Ejemplo/)).toBeInTheDocument();
    expect(screen.getByText(/no se ha enviado ningún correo/i)).toBeInTheDocument();
  });

  it('la previsualización va en un iframe aislado, no inyectada en la página', () => {
    // El correo trae su propio <html> con estilos inline: inyectarlo con
    // `dangerouslySetInnerHTML` rompería los estilos de la intranet.
    mockHooks({ previewResult: { subject: 'x', html: '<html><body>ok</body></html>' } });
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    const frame = screen.getByTitle(/previsualización de/i);
    expect(frame.tagName).toBe('IFRAME');
    expect(frame).toHaveAttribute('sandbox', '');
  });

  it('pide confirmación antes de restaurar, y aclara que no se pierde el texto', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    fireEvent.click(screen.getByRole('button', { name: /restaurar por defecto/i }));

    expect(confirmSpy.mock.calls[0]![0]).toContain('no se borra');
    expect(restore).toHaveBeenCalledWith('staff_invited');
    confirmSpy.mockRestore();
  });

  it('cancelar la confirmación no restaura', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<EmailTemplateEditor template={buildTemplate()} availablePlaceholders={PLACEHOLDERS} />);

    fireEvent.click(screen.getByRole('button', { name: /restaurar por defecto/i }));

    expect(restore).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('no ofrece restaurar una plantilla que ya usa el texto por defecto', () => {
    // El botón no haría nada: sería una acción que promete un cambio inexistente.
    render(
      <EmailTemplateEditor
        template={buildTemplate({ isActive: false })}
        availablePlaceholders={PLACEHOLDERS}
      />
    );

    expect(
      screen.queryByRole('button', { name: /restaurar por defecto/i })
    ).not.toBeInTheDocument();
  });
});
