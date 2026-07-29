import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeamOrgChart } from './TeamOrgChart';

describe('TeamOrgChart', () => {
  it('publica el organigrama como imagen, NO en un iframe', () => {
    // La CSP de producción declara `frame-src https://accounts.google.com`
    // (sin `'self'`) y `object-src 'none'`: un iframe/embed con el PDF
    // funcionaría hoy (la cabecera va en Report-Only) y se rompería en
    // silencio al pasarla a enforcing. Este test es la guarda de esa decisión.
    const { container } = render(<TeamOrgChart />);

    expect(container.querySelector('iframe')).toBeNull();
    expect(container.querySelector('embed')).toBeNull();
    expect(container.querySelector('object')).toBeNull();
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      '/organigrama/organigrama-amelia-2026.png'
    );
  });

  it('describe el gráfico y remite al directorio en el texto alternativo', () => {
    // Un organigrama en imagen es opaco para un lector de pantalla; el `alt`
    // tiene que decir qué es y dónde está la misma información en texto.
    render(<TeamOrgChart />);

    const image = screen.getByRole('img');
    expect(image).toHaveAccessibleName(/organigrama/i);
    expect(image).toHaveAccessibleName(/directorio/i);
  });

  it('deja el PDF accesible para abrir y para descargar', () => {
    render(<TeamOrgChart />);

    const abrir = screen.getByRole('link', { name: /abrir a tamaño completo/i });
    expect(abrir).toHaveAttribute('href', '/organigrama/organigrama-amelia-2026.pdf');
    expect(abrir).toHaveAttribute('target', '_blank');

    const descargar = screen.getByRole('link', { name: /descargar pdf/i });
    expect(descargar).toHaveAttribute('download');
  });

  it('avisa de que el gráfico no cubre a toda la plantilla', () => {
    // El PDF es "The team behind Hincator®" (28 personas); el directorio tiene
    // las 36 del grupo. Sin este aviso, quien esté en Lab u Ops y no se
    // encuentre en el organigrama creerá que falta un dato suyo.
    render(<TeamOrgChart />);

    expect(screen.getByText(/equipo del Hincator/i)).toBeInTheDocument();
    expect(screen.getByText(/Lab y Ops/i)).toBeInTheDocument();
  });
});
