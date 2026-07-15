import { useForm } from 'react-hook-form';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { useCompleteProfile } from '../application/useCompleteProfile';
import type { CompleteProfileInput, OnboardingStep } from '../domain/models';
import styles from './ProfileStep.module.css';

interface ProfileStepProps {
  step: OnboardingStep;
}

/** Último paso — el contrato solo especifica "campos borrador (phone,
 * address, emergency contact)", así que este formulario cubre esos tres
 * datos (contacto de emergencia como nombre + teléfono + relación
 * opcional). El deck muestra un formulario más largo (DNI, fecha de
 * nacimiento, departamento…) que corresponde a datos de alta de plantilla
 * gestionados por el admin, no al cuerpo de `complete-profile`. */
export function ProfileStep({ step }: ProfileStepProps) {
  const { mutate, isPending, error } = useCompleteProfile();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompleteProfileInput>({
    defaultValues: {
      phone: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',
    },
  });

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';

  const onSubmit = (values: CompleteProfileInput) => {
    mutate({ stepId: step.id, input: values });
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
          <CheckCircle2 className={styles.completedIcon} />
          <h2 className={styles.completedTitle}>Perfil completado</h2>
          <p className={styles.completedSubtitle}>
            Ya formas parte del equipo. Hemos guardado tus datos de contacto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.root} onSubmit={handleSubmit(onSubmit)}>
      <h2 className={styles.title}>{step.title || 'Completa tu perfil'}</h2>
      <p className={styles.subtitle}>Último paso. Todos los campos son obligatorios.</p>

      <div className={styles.field}>
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" placeholder="+34 600 000 000" {...register('phone', { required: true })} />
        {errors.phone && <p className={styles.error}>Indica un teléfono de contacto.</p>}
      </div>

      <div className={styles.field}>
        <Label htmlFor="address">Dirección postal</Label>
        <Input
          id="address"
          placeholder="Calle, número, piso, ciudad"
          {...register('address', { required: true })}
        />
        {errors.address && <p className={styles.error}>Indica tu dirección postal.</p>}
      </div>

      <div className={styles.sectionTitle}>Contacto de emergencia</div>
      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="emergencyContactName">Nombre</Label>
          <Input
            id="emergencyContactName"
            placeholder="Nombre y apellidos"
            {...register('emergencyContactName', { required: true })}
          />
        </div>
        <div className={styles.field}>
          <Label htmlFor="emergencyContactPhone">Teléfono</Label>
          <Input
            id="emergencyContactPhone"
            placeholder="+34 600 000 000"
            {...register('emergencyContactPhone', { required: true })}
          />
        </div>
      </div>
      {(errors.emergencyContactName || errors.emergencyContactPhone) && (
        <p className={styles.error}>Completa el nombre y el teléfono del contacto de emergencia.</p>
      )}

      <div className={styles.field}>
        <Label htmlFor="emergencyContactRelationship">Relación (opcional)</Label>
        <Input
          id="emergencyContactRelationship"
          placeholder="Ej. madre, pareja, hermano…"
          {...register('emergencyContactRelationship')}
        />
      </div>

      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo guardar tu perfil.'}
        </p>
      )}

      <div className={styles.footer}>
        <Button type="submit" variant="dark" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Finalizar onboarding'}
        </Button>
      </div>
    </form>
  );
}
