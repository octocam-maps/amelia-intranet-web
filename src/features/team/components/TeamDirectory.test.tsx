import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TeamMember } from '../domain/models';
import { TeamDirectory } from './TeamDirectory';
import styles from './TeamDirectory.module.css';

/** El correo más largo de la plantilla real (34 caracteres): es el que se salía
 *  de la tarjeta y el que fija el caso a cubrir. */
const CORREO_LARGO = 'raimonda.murauskaite@ameliahub.com';

function buildMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    id: 'user-1',
    fullName: 'Raimonda Murauskaite',
    jobTitle: 'Operaciones',
    entityCode: 'hincator',
    entityName: 'Hincator',
    phone: null,
    email: CORREO_LARGO,
    avatarUrl: null,
    ...overrides,
  };
}

describe('TeamDirectory', () => {
  it('muestra el nombre, el puesto y el correo de cada persona', () => {
    render(<TeamDirectory members={[buildMember()]} isLoading={false} />);

    expect(screen.getByText('Raimonda Murauskaite')).toBeInTheDocument();
    expect(screen.getByText('Operaciones')).toBeInTheDocument();
    expect(screen.getByText(CORREO_LARGO)).toBeInTheDocument();
  });

  it('el correo va en su propio elemento, para que pueda encogerse en la tarjeta', () => {
    // ESTE TEST PROTEGE UN ARREGLO DE LAYOUT que jsdom no puede comprobar solo:
    // no calcula anchos, así que el desborde real no se puede assertar. Lo que sí
    // se puede fijar es la ESTRUCTURA de la que depende el arreglo.
    //
    // El correo estaba como texto suelto dentro de un flex (`.contactRow`), es
    // decir un item anónimo, y a esos no se les puede aplicar `min-width: 0` ni
    // `overflow-wrap`. Sin sitio donde partirse, su ancho mínimo era el del texto
    // completo y se salía de la tarjeta. Si alguien "simplifica" quitando este
    // envoltorio, el bug vuelve y este test es el que lo avisa.
    render(<TeamDirectory members={[buildMember()]} isLoading={false} />);

    expect(screen.getByText(CORREO_LARGO)).toHaveClass(styles.contactValue ?? '');
  });

  it('el teléfono, cuando existe, va envuelto igual que el correo', () => {
    render(<TeamDirectory members={[buildMember({ phone: '+34 600 000 000' })]} isLoading={false} />);

    expect(screen.getByText('+34 600 000 000')).toHaveClass(styles.contactValue ?? '');
  });

  it('sin teléfono no pinta una fila de contacto vacía', () => {
    const { container } = render(
      <TeamDirectory members={[buildMember({ phone: null })]} isLoading={false} />
    );

    // Solo la fila del correo: una fila con el icono del teléfono y nada al lado
    // haría pensar que falta un dato que en realidad nadie ha rellenado.
    expect(container.querySelectorAll(`.${styles.contactRow}`)).toHaveLength(1);
  });
});
