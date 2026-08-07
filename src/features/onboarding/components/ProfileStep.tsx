import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircledIcon, CheckIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ApiError } from '@/lib/http/api-client';
import { ENTITY_SHORT_NAME, type EntityCode } from '@/lib/entities';
import { useDepartments } from '@/features/departments/application/useDepartments';
import { groupDepartments } from '@/features/departments/domain/models';
import type { Department, DepartmentGroup } from '@/features/departments/domain/models';
import { useCompleteProfile } from '../application/useCompleteProfile';
import type { CompleteProfileInput, OnboardingStep } from '../domain/models';
import styles from './ProfileStep.module.css';

interface ProfileStepProps {
  step: OnboardingStep;
}

/**
 * Nombres de departamento que aparecen MÁS DE UNA VEZ en la lista.
 *
 * Los mismos departamentos existen en las cuatro sociedades del grupo, así que
 * cuando la lista no está filtrada por entidad salen cuatro «Administración»
 * idénticas y elegir es elegir a ciegas. Desde que `GET /departments` filtra por
 * la sociedad de quien pregunta, esto normalmente devuelve un conjunto VACÍO —
 * queda para el caso que el backend no puede filtrar: un usuario sin entidad
 * asignada, al que se le muestran todas para no dejarlo sin poder terminar el
 * paso.
 */
function ambiguousDepartmentNames(departments: Department[]): ReadonlySet<string> {
  const vistos = new Set<string>();
  const repetidos = new Set<string>();
  for (const { name } of departments) {
    if (vistos.has(name)) repetidos.add(name);
    else vistos.add(name);
  }
  return repetidos;
}

/**
 * Etiqueta de la opción: añade la sociedad SOLO si el nombre está repetido.
 *
 * Añadirla siempre sería ruido en el caso normal —«Administración · Hub» cuando
 * todas las opciones son de Hub no distingue nada— y omitirla siempre deja el
 * selector inservible en el caso ambiguo. Se decide por lista, no por gusto.
 */
function departmentLabel(
  department: Department,
  ambiguos: ReadonlySet<string>,
): string {
  if (!ambiguos.has(department.name) || !department.entityCode) return department.name;
  // `ENTITY_SHORT_NAME` (no el nombre comercial largo): en un desplegable el
  // prefijo «Amelia» se repite en todas las opciones y no aporta.
  const sociedad = ENTITY_SHORT_NAME[department.entityCode as EntityCode];
  return sociedad ? `${department.name} · ${sociedad}` : department.name;
}

/**
 * Encabezado de un grupo, con el mismo criterio de desambiguación que sus
 * hojas: el usuario sin entidad ve los departamentos de las cuatro sociedades,
 * y sin esto leería cuatro grupos «Producto» idénticos.
 *
 * La sociedad se toma del primer hijo porque todos los de un grupo comparten
 * entidad — el `ORDER BY e.code, ...` del backend los deja contiguos.
 */
function groupHeading(group: DepartmentGroup, ambiguos: ReadonlySet<string>): string {
  const [first] = group.departments;
  if (!group.parentName || !first) return group.parentName ?? '';
  // `Producto` es un departamento más de la lista, así que si está repetido ya
  // figura en `ambiguos` y `departmentLabel` resuelve igual que para las hojas.
  return departmentLabel({ ...first, name: group.parentName }, ambiguos);
}

/** Claves de `ApiError.fieldErrors` (nombres del DTO del backend, snake_case)
 * -> campo del formulario (camelCase) — permite que un 422 nativo de
 * Pydantic (campo obligatorio vacío, DNI/NIE con formato inválido) se
 * muestre bajo el input correspondiente en vez de un único error genérico. */
const FORM_FIELD_BY_BACKEND_KEY: Record<string, keyof CompleteProfileInput> = {
  full_name: 'fullName',
  birth_date: 'birthDate',
  dni_nie: 'dniNie',
  personal_phone: 'personalPhone',
  company_phone: 'companyPhone',
  address: 'address',
  department_id: 'departmentId',
};

/**
 * Paso **4** del onboarding ("Completar perfil", RF §3.5) —
 * deck-fase2/27-completar-perfil.png.
 *
 * Era el paso 5 y el ÚLTIMO; la reordenación de v1.1 (migración
 * `033_onboarding_steps_reorder_v11.sql`) lo movió al 4 y puso la subida de
 * documentación firmada en el 5. Este componente se quedó diciendo "Último
 * paso" y "Finalizar onboarding", que se contradecía de inmediato con el
 * "Continuar al paso 5" que `OnboardingPage` pinta justo debajo al enviarlo.
 * Si vuelves a tocar este copy, comprueba antes cuál es el último paso real.
 *
 * Los 7 campos y su obligatoriedad los
 * fija el backend (`CompleteProfileRequestDTO` +
 * `ensure_profile_data_complete`): `companyPhone` es el único opcional. El
 * `required` de React Hook Form es solo UX — la fuente de verdad del
 * bloqueo es el 422 del backend, que aquí se vuelca campo a campo vía
 * `ApiError.fieldErrors` (o como error de formulario si no mapea a ningún
 * campo conocido).
 */
export function ProfileStep({ step }: ProfileStepProps) {
  const { mutate, isPending } = useCompleteProfile();
  const { data: departments = [], isLoading: isLoadingDepartments } = useDepartments();
  const ambiguos = ambiguousDepartmentNames(departments);
  const departmentGroups = useMemo(() => groupDepartments(departments), [departments]);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CompleteProfileInput>({
    defaultValues: {
      fullName: '',
      birthDate: '',
      dniNie: '',
      personalPhone: '',
      companyPhone: '',
      address: '',
      departmentId: '',
    },
  });

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';
  const departmentId = watch('departmentId');

  const onSubmit = (values: CompleteProfileInput) => {
    clearErrors('root');
    mutate(
      { stepId: step.id, input: values },
      {
        onError: (mutationError) => {
          if (mutationError instanceof ApiError && mutationError.fieldErrors) {
            let mappedAny = false;
            for (const [backendKey, message] of Object.entries(mutationError.fieldErrors)) {
              const formField = FORM_FIELD_BY_BACKEND_KEY[backendKey];
              if (formField) {
                setError(formField, { type: 'server', message });
                mappedAny = true;
              }
            }
            if (mappedAny) return;
          }
          setError('root', {
            type: 'server',
            message: mutationError instanceof Error ? mutationError.message : 'No se pudo guardar tu perfil.',
          });
        },
      }
    );
  };

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear tu perfil.</p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className={styles.root}>
        <div className={styles.completedCard}>
          <CheckCircledIcon className={styles.completedIcon} />
          <h2 className={styles.completedTitle}>Perfil completado</h2>
          <p className={styles.completedSubtitle}>
            Hemos guardado tus datos. Te queda un paso: subir tu documentación firmada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className={styles.title}>{step.title || 'Completa tu perfil'}</h2>
      {/* NO decir "último paso": el perfil dejó de serlo con la reordenación
          de v1.1 (migración 033) — ahora es el 4 y le sigue la documentación
          firmada, que es la que cierra el onboarding. Decirlo aquí se
          contradecía de inmediato con el "Continuar al paso 5" que
          `OnboardingPage` pinta justo debajo al enviar este formulario. */}
      <p className={styles.subtitle}>
        Penúltimo paso. Todos los campos son obligatorios salvo los marcados como opcional.
      </p>

      <div className={styles.field}>
        <Label htmlFor="fullName">Nombre completo</Label>
        <Input
          id="fullName"
          placeholder="Nombre y apellidos"
          {...register('fullName', { required: true })}
        />
        {errors.fullName && <p className={styles.error}>{errors.fullName.message || 'Indica tu nombre completo.'}</p>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="birthDate">Fecha de nacimiento</Label>
          <Input id="birthDate" type="date" {...register('birthDate', { required: true })} />
          {errors.birthDate && (
            <p className={styles.error}>{errors.birthDate.message || 'Indica tu fecha de nacimiento.'}</p>
          )}
        </div>
        <div className={styles.field}>
          <Label htmlFor="dniNie">DNI / NIE</Label>
          <Input
            id="dniNie"
            placeholder="12345678A"
            {...register('dniNie', { required: true })}
          />
          {errors.dniNie && <p className={styles.error}>{errors.dniNie.message || 'Indica tu DNI o NIE.'}</p>}
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="personalPhone">Móvil personal</Label>
          <Input
            id="personalPhone"
            type="tel"
            placeholder="+34 600 000 000"
            {...register('personalPhone', { required: true })}
          />
          {errors.personalPhone && (
            <p className={styles.error}>{errors.personalPhone.message || 'Indica un móvil de contacto.'}</p>
          )}
        </div>
        <div className={styles.field}>
          <Label htmlFor="companyPhone">Móvil de empresa · opcional</Label>
          <Input
            id="companyPhone"
            type="tel"
            placeholder="Se asigna al incorporarte"
            {...register('companyPhone')}
          />
          {errors.companyPhone && <p className={styles.error}>{errors.companyPhone.message}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="address">Dirección postal</Label>
        <Input
          id="address"
          placeholder="Calle, número, piso, ciudad"
          {...register('address', { required: true })}
        />
        {errors.address && <p className={styles.error}>{errors.address.message || 'Indica tu dirección postal.'}</p>}
      </div>

      <div className={styles.field}>
        <Label htmlFor="departmentId">Departamento</Label>
        <input type="hidden" {...register('departmentId', { required: true })} />
        <Select
          value={departmentId}
          disabled={isLoadingDepartments}
          onValueChange={(value) => setValue('departmentId', value, { shouldValidate: true })}
        >
          <SelectTrigger id="departmentId">
            <SelectValue placeholder={isLoadingDepartments ? 'Cargando departamentos…' : 'Selecciona un departamento'} />
          </SelectTrigger>
          <SelectContent>
            {/* Agrupado por rama (catálogo 2026): `Software` y `Hardware`
                aparecen bajo `Producto` en vez de sueltos entre las raíces,
                donde no se entendería que son subdivisiones suyas.
                Las hojas conservan `departmentLabel`, que añade la sociedad
                cuando el nombre está repetido — sin él, el usuario sin entidad
                vería cuatro «Software» idénticos dentro de cuatro «Producto». */}
            {departmentGroups.map((group, index) => (
              <SelectGroup key={`${group.parentName ?? 'raiz'}-${index}`}>
                {group.parentName && (
                  <SelectLabel>{groupHeading(group, ambiguos)}</SelectLabel>
                )}
                {group.departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {departmentLabel(department, ambiguos)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentId && (
          <p className={styles.error}>{errors.departmentId.message || 'Selecciona tu departamento.'}</p>
        )}
      </div>

      {errors.root && <p className={styles.error}>{errors.root.message}</p>}

      <div className={styles.footer}>
        <Button type="submit" variant="dark" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar perfil'}
          {!isPending && <CheckIcon aria-hidden />}
        </Button>
      </div>
    </form>
  );
}
