import { describe, expect, it } from 'vitest';
import { CONTRACT_TYPES, CONTRACT_TYPE_LABEL, CONTRACT_TYPE_OPTIONS } from './contractType';

/**
 * Mismo patrón que `lib/entities.test.ts`: un único origen para la lista, sus
 * etiquetas y las opciones de formulario, para no repetir aquí el defecto que
 * tenía el código de entidad (`'hub' | 'lab' | 'ops'` copiado en cinco sitios).
 */
describe('Tipo de contrato — un único origen', () => {
  it('cada código tiene etiqueta en español', () => {
    for (const code of CONTRACT_TYPES) {
      expect(CONTRACT_TYPE_LABEL[code], `falta etiqueta de ${code}`).toBeTruthy();
    }
  });

  it('las opciones del selector se derivan del listado, no se escriben a mano', () => {
    expect(CONTRACT_TYPE_OPTIONS.map((o) => o.value)).toEqual([...CONTRACT_TYPES]);
  });

  it('incluye los tres valores de la hoja de plantilla de RRHH', () => {
    expect(CONTRACT_TYPES).toEqual(['full_time', 'part_time', 'intern']);
  });
});
