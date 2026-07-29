/**
 * El tipo de contrato de una persona de la plantilla, en un ÚNICO sitio.
 *
 * Espejo del `CHECK` `ck_users_contract_type` (migración 037 de
 * `amelia-intranet-back`) y de `ContractType = Literal["full_time",
 * "part_time", "intern"]` en `back/src/features/staff/infrastructure/schemas.py`.
 * Es de esta feature, no compartido: a diferencia de `EntityCode`
 * (`lib/entities.ts`), ningún otro feature del frontend necesita esta lista.
 *
 * El campo es `Optional` en el backend: `null` significa "no sabemos su tipo
 * de contrato", NO "jornada completa". Quien lo consuma debe distinguirlo
 * (ver `parseEnumNullable` en `lib/parseEnum.ts`).
 */
export const CONTRACT_TYPES = ['full_time', 'part_time', 'intern'] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number];

/** Los tres valores de la hoja de plantilla de RRHH: Full-Time (30
 *  personas), Part-Time (3), Intern (3). */
export const CONTRACT_TYPE_LABEL: Record<ContractType, string> = {
  full_time: 'Jornada completa',
  part_time: 'Jornada parcial',
  intern: 'Becario/a',
};

/** Opciones de formulario, derivadas del listado — nunca escritas a mano.
 *  NO incluye la opción "Sin especificar": esa es responsabilidad de quien
 *  construye el selector (manda `null`, no un código de este listado). */
export const CONTRACT_TYPE_OPTIONS: ReadonlyArray<{ value: ContractType; label: string }> =
  CONTRACT_TYPES.map((value) => ({ value, label: CONTRACT_TYPE_LABEL[value] }));
