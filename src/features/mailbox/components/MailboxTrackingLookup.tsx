import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertTriangle, Clock3, MailQuestion, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ApiError } from '@/lib/http/api-client';
import { useTrackMailboxMessage } from '../application/useTrackMailboxMessage';
import type { MailboxMessageCategory, TrackedMailboxMessageStatus } from '../domain/models';
import { getLastReferenceCode } from '../infrastructure/reference-code-storage';
import styles from './MailboxTrackingLookup.module.css';

const CATEGORY_LABEL: Record<MailboxMessageCategory, string> = {
  sugerencia: 'Sugerencia',
  consulta: 'Consulta',
  incidencia: 'Incidencia',
};

const STATUS_LABEL: Record<TrackedMailboxMessageStatus, string> = {
  new: 'Pendiente de respuesta',
  read: 'En revisión',
  resolved: 'Resuelto',
};

const STATUS_BADGE_VARIANT: Record<TrackedMailboxMessageStatus, 'warning' | 'info' | 'success'> = {
  new: 'warning',
  read: 'info',
  resolved: 'success',
};

function formatTrackedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface FormValues {
  referenceCode: string;
}

/**
 * deck-fase6 no cubre esta pantalla (no está en el material de apoyo de la
 * fase) — layout propio, minimalista, siguiendo el mismo lenguaje visual
 * que `AnonymousMailboxForm` (tarjeta centrada, aviso de anonimato, un solo
 * campo). Único canal del emisor anónimo para leer la respuesta de RRHH:
 * NUNCA pide ni muestra ningún dato de identidad, solo el `reference_code`.
 */
export function MailboxTrackingLookup() {
  const [prefilled] = useState(() => getLastReferenceCode() ?? '');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { referenceCode: prefilled } });
  const { mutate, data, error, isPending, reset } = useTrackMailboxMessage();

  const onSubmit = ({ referenceCode }: FormValues) => {
    reset();
    mutate(referenceCode.trim().toUpperCase());
  };

  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <div className={styles.root}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.field}>
          <Label htmlFor="referenceCode">Código de referencia</Label>
          <Input
            id="referenceCode"
            placeholder="Ej. 3F2A9C1B0D4E"
            autoComplete="off"
            autoCapitalize="characters"
            {...register('referenceCode', { required: true, minLength: 4 })}
          />
          {errors.referenceCode && (
            <p className={styles.error}>Introduce el código que te dimos al enviar el mensaje.</p>
          )}
          <p className={styles.hint}>
            Es el único dato que necesitamos: no te pedimos nombre ni ningún otro identificador.
          </p>
        </div>

        <Button type="submit" variant="dark" className={styles.submit} disabled={isPending}>
          <Search />
          Consultar estado
        </Button>
      </form>

      {error && (
        <div className={styles.notice}>
          <AlertTriangle className={styles.noticeIcon} />
          <p>
            {notFound
              ? 'No encontramos ningún mensaje con ese código. Revisa que esté escrito tal y como te lo mostramos al enviarlo.'
              : 'No se pudo consultar el estado ahora mismo. Inténtalo de nuevo en unos minutos.'}
          </p>
        </div>
      )}

      {data && (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <span className={styles.resultMeta}>
              {CATEGORY_LABEL[data.category]}
              {data.subject ? ` · ${data.subject}` : ''} · enviado el {formatTrackedDate(data.createdAt)}
            </span>
            <Badge variant={STATUS_BADGE_VARIANT[data.status]}>{STATUS_LABEL[data.status]}</Badge>
          </div>

          <p className={styles.messageBubble}>{data.body}</p>

          {data.adminReply ? (
            <div className={styles.replyBubble}>
              <span className={styles.replyLabel}>Respuesta de RRHH</span>
              <p>{data.adminReply}</p>
            </div>
          ) : (
            <div className={styles.pendingNotice}>
              <Clock3 className={styles.pendingIcon} />
              <p>Aún no hay respuesta. Guarda el código y vuelve a consultarlo más tarde.</p>
            </div>
          )}

          {!data.adminReply && data.status === 'new' && (
            <p className={styles.hintRow}>
              <MailQuestion className={styles.hintIcon} />
              RRHH todavía no ha abierto tu mensaje.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
