import { describe, expect, it } from 'vitest';
import {
  PLACEHOLDER_LABEL,
  placeholderToken,
  toDisplay,
  toStorage,
} from './placeholders';

describe('toDisplay — lo guardado → lo que ve el admin', () => {
  it('traduce la sintaxis del backend a nombres legibles', () => {
    expect(toDisplay('Hola {{full_name}},')).toBe('Hola [Nombre de la persona],');
  });

  it('traduce varios campos en el mismo texto', () => {
    expect(toDisplay('{{full_name}} entra como {{job_title}} en {{entity_name}}')).toBe(
      '[Nombre de la persona] entra como [Puesto] en [Sociedad]'
    );
  });

  it('tolera espacios dentro de las llaves', () => {
    expect(toDisplay('{{ full_name }}')).toBe('[Nombre de la persona]');
  });

  it('deja tal cual un campo que no está en la lista', () => {
    // Preferible que el admin vea `{{campo_nuevo}}` —raro pero funcional— a que
    // desaparezca del textarea y se pierda al guardar.
    expect(toDisplay('Hola {{campo_nuevo}}')).toBe('Hola {{campo_nuevo}}');
  });

  it('no toca el texto normal', () => {
    expect(toDisplay('Recuerda revisar el [pendiente] antes del viernes')).toBe(
      'Recuerda revisar el [pendiente] antes del viernes'
    );
  });
});

describe('toStorage — lo que escribe el admin → lo guardado', () => {
  it('traduce los nombres legibles a la sintaxis del backend', () => {
    expect(toStorage('Hola [Nombre de la persona],')).toBe('Hola {{full_name}},');
  });

  it('respeta los corchetes que NO son un campo', () => {
    // Si el admin escribe "[pendiente]" quiere ese texto, no un campo.
    expect(toStorage('Estado: [pendiente de firma]')).toBe('Estado: [pendiente de firma]');
  });

  it('respeta un {{campo}} que ya viniera escrito', () => {
    // Para no romper una plantilla editada por API o directamente en la BD.
    expect(toStorage('Hola {{full_name}}')).toBe('Hola {{full_name}}');
  });

  it('traduce todas las apariciones, no solo la primera', () => {
    expect(toStorage('[Puesto] y otra vez [Puesto]')).toBe('{{job_title}} y otra vez {{job_title}}');
  });
});

describe('ida y vuelta', () => {
  it('lo guardado sobrevive al viaje completo', () => {
    // El invariante que importa: abrir una plantilla y guardarla sin tocar nada NO
    // debe cambiar lo que hay en la BD.
    for (const stored of [
      'Hola {{full_name}},\n\nEntras como {{job_title}} en {{entity_name}}.',
      '{{title}}',
      '{{body}}\n\nUn saludo.',
      'Sin ningún campo.',
      'Con un [corchete] que no es campo.',
    ]) {
      expect(toStorage(toDisplay(stored))).toBe(stored);
    }
  });

  it('todos los campos conocidos hacen el viaje redondo', () => {
    for (const field of Object.keys(PLACEHOLDER_LABEL)) {
      expect(toStorage(toDisplay(`{{${field}}}`))).toBe(`{{${field}}}`);
    }
  });
});

describe('las etiquetas son únicas', () => {
  it('ninguna se repite, o la traducción de vuelta sería ambigua', () => {
    const labels = Object.values(PLACEHOLDER_LABEL);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('ninguna contiene corchetes, que romperían el delimitador', () => {
    for (const label of Object.values(PLACEHOLDER_LABEL)) {
      expect(label).not.toMatch(/[[\]]/);
    }
  });
});

describe('placeholderToken', () => {
  it('produce el texto que se inserta en el editor', () => {
    expect(placeholderToken('full_name')).toBe('[Nombre de la persona]');
  });

  it('un campo sin etiqueta usa su clave, en vez de romperse', () => {
    expect(placeholderToken('campo_nuevo')).toBe('[campo_nuevo]');
  });
});
