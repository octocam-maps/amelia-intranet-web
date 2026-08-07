import { describe, expect, it } from 'vitest';
import { groupDepartments } from './models';
import type { Department } from './models';

/**
 * Catálogo 2026 (migración 054 del backend): `Software` y `Hardware` cuelgan
 * de `Producto`. El selector los agrupa bajo su padre; sueltos entre las
 * raíces no se entendería que son subdivisiones suyas.
 */

function department(name: string, parentName: string | null = null): Department {
  return {
    id: `id-${name}`,
    name,
    entityId: 'e-hub',
    entityCode: 'hub',
    parentDepartmentId: parentName ? `id-${parentName}` : null,
    parentName,
  };
}

/** El orden real que devuelve el backend: cada hoja pegada a su padre. */
const CATALOGO_2026: Department[] = [
  department('I+D'),
  department('Marketing'),
  department('Operaciones'),
  department('Producto'),
  department('Hardware', 'Producto'),
  department('Software', 'Producto'),
  department('Ventas'),
];

describe('groupDepartments', () => {
  it('agrupa las hojas bajo su padre y deja las raíces sin encabezado', () => {
    const groups = groupDepartments(CATALOGO_2026);

    expect(groups.map((g) => g.parentName)).toEqual([null, 'Producto', null]);
    expect(groups[1]?.departments.map((d) => d.name)).toEqual(['Hardware', 'Software']);
  });

  it('mantiene el orden del backend sin reordenar', () => {
    const groups = groupDepartments(CATALOGO_2026);
    const flattened = groups.flatMap((g) => g.departments.map((d) => d.name));

    expect(flattened).toEqual(CATALOGO_2026.map((d) => d.name));
  });

  it('deja «Producto» también como opción seleccionable, no solo como encabezado', () => {
    const groups = groupDepartments(CATALOGO_2026);
    const seleccionables = groups.flatMap((g) => g.departments.map((d) => d.name));

    expect(seleccionables).toContain('Producto');
  });

  it('no crea grupos si ningún departamento tiene padre', () => {
    const groups = groupDepartments([department('Marketing'), department('Ventas')]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.parentName).toBeNull();
  });

  it('sobrevive a una lista vacía', () => {
    expect(groupDepartments([])).toEqual([]);
  });
});
