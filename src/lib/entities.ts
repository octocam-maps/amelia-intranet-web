/**
 * Las sociedades del grupo Amelia, en un ÚNICO sitio.
 *
 * Por qué existe este módulo: el código de entidad estaba duplicado en cinco
 * features (`announcements`, `dashboard`, `invitations`, `staff`, `team`), cada
 * una con su propio tipo cerrado `'hub' | 'lab' | 'ops'`, más tres mapas de
 * etiquetas y dos listas de opciones de formulario. Al añadir `hincator` como
 * cuarta sociedad (2026-07-29, migración 036) había que acordarse de diez
 * sitios, y olvidar uno no daba un error de compilación: daba una etiqueta en
 * blanco, o —peor— **19 personas mostradas como Hub**, porque el mapper del
 * dashboard hace `parseEnum(..., 'hub')` y el fallback habría absorbido el valor
 * desconocido en silencio.
 *
 * Espejo del `CHECK` de `entities.code` en el backend (migración 036) y de los
 * tres `EntityCode = Literal[...]` de `holidays`, `announcements` y `staff`. Si
 * aparece una quinta sociedad, se añade AQUÍ y el resto del frontend la hereda.
 */
export const ENTITY_CODES = ['hub', 'lab', 'ops', 'hincator'] as const;

export type EntityCode = (typeof ENTITY_CODES)[number];

/** Nombre comercial. `Hincator` va sin el prefijo "Amelia": es la marca del
 *  producto, no una división nombrada como las otras tres. */
export const ENTITY_NAME: Record<EntityCode, string> = {
  hub: 'Amelia Hub',
  lab: 'Amelia Lab',
  ops: 'Amelia Ops',
  hincator: 'Hincator',
};

/** Etiqueta corta, para selectores y badges donde el prefijo "Amelia" sobra. */
export const ENTITY_SHORT_NAME: Record<EntityCode, string> = {
  hub: 'Hub',
  lab: 'Lab',
  ops: 'Ops',
  hincator: 'Hincator',
};

/** Opciones de formulario, derivadas del listado — nunca escritas a mano. */
export const ENTITY_OPTIONS: ReadonlyArray<{ code: EntityCode; label: string }> = ENTITY_CODES.map(
  (code) => ({ code, label: ENTITY_SHORT_NAME[code] })
);
