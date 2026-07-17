import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckCircledIcon, PaperPlaneIcon } from '@radix-ui/react-icons';
import { KeyRoundIcon, ShieldCheckIcon } from '@/components/icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import { useCreateMailboxMessage } from '../application/useCreateMailboxMessage';
import type { MailboxMessageCategory } from '../domain/models';
import { saveLastReferenceCode } from '../infrastructure/reference-code-storage';
import styles from './AnonymousMailboxForm.module.css';

const CATEGORY_LABEL: Record<MailboxMessageCategory, string> = {
  sugerencia: 'Sugerencia',
  consulta: 'Consulta',
  incidencia: 'Incidencia',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as MailboxMessageCategory[];

interface FormValues {
  body: string;
}

/**
 * deck-fase6/13-buzon-empleado.png — sin selector de destinatario ni campo
 * de nombre: la anonimidad es estructural, este formulario ni siquiera
 * pregunta quién eres (docs/permisos-roles.md § Fase 6).
 */
export function AnonymousMailboxForm() {
  const [category, setCategory] = useState<MailboxMessageCategory>('sugerencia');
  const [referenceCode, setReferenceCode] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { body: '' } });
  const { mutateAsync, error } = useCreateMailboxMessage();

  const onSubmit = async (values: FormValues) => {
    const result = await mutateAsync({ category, body: values.body });
    setReferenceCode(result.referenceCode);
    // El código de referencia es la ÚNICA forma de leer la respuesta más
    // adelante — no hay email ni notificación que lo recuerde (el mensaje
    // es anónimo, no hay a quién avisar). Guardarlo aquí es una comodidad
    // de "recibo", no un dato de identidad (ver reference-code-storage.ts).
    saveLastReferenceCode(result.referenceCode);
    reset();
  };

  if (referenceCode) {
    return (
      <div className={styles.success}>
        <CheckCircledIcon className={styles.successIcon} />
        <p className={styles.successTitle}>Mensaje enviado</p>
        <p className={styles.successBody}>
          Referencia <strong>{referenceCode}</strong>. Guarda este código: es la única forma de
          consultar la respuesta, ya que el mensaje es anónimo.
        </p>
        <Link to="/buzon-anonimo/seguimiento" className={styles.trackLink}>
          <KeyRoundIcon />
          Ver estado de mi mensaje
        </Link>
        <Button variant="outline" onClick={() => setReferenceCode(null)}>
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.notice}>
        <ShieldCheckIcon className={styles.noticeIcon} />
        <p>
          Tu mensaje llega a RRHH <strong>sin tu nombre</strong>. No registramos tu identidad ni tu IP.
          Al enviarlo recibirás un código de referencia: guárdalo, porque es la única forma de
          consultar la respuesta más adelante.
        </p>
      </div>

      <div className={styles.field}>
        <Label>Tipo de mensaje</Label>
        <div className={styles.categoryGroup}>
          {CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              className={cn(styles.categoryPill, category === value && styles.categoryPillActive)}
              onClick={() => setCategory(value)}
            >
              {CATEGORY_LABEL[value]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="body">
          Tu mensaje <span className={styles.required}>*</span>
        </Label>
        <Textarea
          id="body"
          rows={10}
          placeholder="Cuéntanos qué te gustaría mejorar o preguntar…"
          {...register('body', { required: true, minLength: 10 })}
        />
        <p className={styles.hint}>Evita incluir datos que puedan identificarte si quieres mantener el anonimato completo.</p>
      </div>

      {errors.body && <p className={styles.error}>Escribe un mensaje de al menos 10 caracteres.</p>}
      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo enviar el mensaje.'}
        </p>
      )}

      <Button type="submit" variant="dark" className={styles.submit} disabled={isSubmitting}>
        <PaperPlaneIcon />
        Enviar de forma anónima
      </Button>
    </form>
  );
}
