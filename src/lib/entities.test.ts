import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENTITY_CODES, ENTITY_NAME, ENTITY_SHORT_NAME, ENTITY_OPTIONS } from './entities';

/**
 * El código de entidad vive en cinco sitios a la vez: el `CHECK` de
 * `entities.code`, tres `Literal` de Pydantic en el backend, y este módulo. No
 * hay forma de acoplarlos en tiempo de compilación —son repos distintos—, así
 * que lo que queda es una guarda que impida el regreso de la duplicación DENTRO
 * del frontend, que es donde estaba (cinco features con su propio tipo cerrado).
 */
describe('Entidades — un único origen', () => {
  it('cada código tiene nombre largo y corto', () => {
    for (const code of ENTITY_CODES) {
      expect(ENTITY_NAME[code], `falta nombre largo de ${code}`).toBeTruthy();
      expect(ENTITY_SHORT_NAME[code], `falta nombre corto de ${code}`).toBeTruthy();
    }
  });

  it('las opciones de formulario se derivan del listado, no se escriben a mano', () => {
    expect(ENTITY_OPTIONS.map((o) => o.code)).toEqual([...ENTITY_CODES]);
  });

  it('incluye hincator', () => {
    // 19 de los 36 trabajadores de la plantilla. Si alguien lo quita, esas 19
    // personas dejan de tener entidad válida en el frontend.
    expect(ENTITY_CODES).toContain('hincator');
  });

  it('ninguna feature declara su propia lista de entidades', () => {
    // El defecto original: `'hub' | 'lab' | 'ops'` copiado en cinco features.
    // Añadir la cuarta sociedad exigía acordarse de diez sitios, y olvidar uno
    // no rompía la compilación — daba una etiqueta vacía o, en el mapper del
    // dashboard, 19 personas etiquetadas como Hub por el fallback de `parseEnum`.
    const ficheros = globSync('src/**/*.ts?(x)', { cwd: process.cwd() }).filter(
      (f) => !f.endsWith('.test.ts') && !f.endsWith('.test.tsx') && f !== 'src/lib/entities.ts'
    );

    const infractores = ficheros.filter((f) => {
      const contenido = readFileSync(f, 'utf8');
      // Una unión de literales con hub y lab, o un array con los dos: es una
      // lista de entidades propia.
      return (
        /'hub'\s*\|\s*'lab'/.test(contenido) ||
        /\[\s*'hub'\s*,\s*'lab'/.test(contenido)
      );
    });

    expect(infractores).toEqual([]);
  });
});
