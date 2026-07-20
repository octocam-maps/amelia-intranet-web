import { useForm } from 'react-hook-form';
import { CheckCircledIcon, CheckIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { ApiError } from '@/lib/http/api-client';
import { useDepartments } from '@/features/departments/application/useDepartments';
import { useCompleteProfile } from '../application/useCompleteProfile';
import type { CompleteProfileInput, OnboardingStep } from '../domain/models';
import styles from './ProfileStep.module.css';

interface ProfileStepProps {
  step: OnboardingStep;
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
 * Paso 5 del onboarding ("Completar perfil", RF §3.5) —
 * deck-fase2/27-completar-perfil.png. Los 7 campos y su obligatoriedad los
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
            Ya formas parte del equipo. Hemos guardado tus datos de perfil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className={styles.title}>{step.title || 'Completa tu perfil'}</h2>
      <p className={styles.subtitle}>
        Último paso. Todos los campos son obligatorios salvo los marcados como opcional.
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
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
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
          {isPending ? 'Guardando…' : 'Finalizar onboarding'}
          {!isPending && <CheckIcon aria-hidden />}
        </Button>
      </div>
    </form>
  );
}
