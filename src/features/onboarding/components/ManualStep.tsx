import { CheckCircledIcon, DownloadIcon, ExternalLinkIcon, ReaderIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { useAcknowledgeManual } from '../application/useAcknowledgeManual';
import type { OnboardingStep } from '../domain/models';
import styles from './ManualStep.module.css';

interface ManualStepProps {
  step: OnboardingStep;
}

/**
 * Lectura de los manuales de referencia. Desde la reordenación de v1.1 es el
 * paso 3 y actúa de PUERTA: hasta confirmar la lectura, el trabajador no llega
 * al perfil ni a la documentación que tiene que firmar y subir.
 *
 * El manual real llega en `step.document` (`GET /onboarding/me`), cuya `url`
 * es `onboarding_documents.storage_ref` — la ruta NO se hardcodea aquí: si
 * RRHH publica otra versión, cambia una fila y esta pantalla la sigue. Antes
 * este componente mostraba un texto de relleno sobre ClickUp que no tenía nada
 * que ver con el manual del paso.
 *
 * `POST .../acknowledge` no lleva cuerpo: una sola confirmación de lectura, sin
 * checklist de secciones. Cuando entre un segundo manual (RF-A6.1, hoy solo hay
 * uno real porque la versión en inglés quedó fuera de alcance) habrá que
 * confirmar por manual y no completar el paso hasta tenerlos todos.
 */
export function ManualStep({ step }: ManualStepProps) {
  const { mutate, isPending, error } = useAcknowledgeManual();

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';
  const document = step.document;

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear los manuales.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <p className={styles.subtitle}>
        Lee el manual y confirma la lectura para continuar. Podrás volver a consultarlo cuando
        quieras.
      </p>

      <div className={styles.manualCard}>
        <div className={styles.manualHeader}>
          <ReaderIcon className={styles.manualIcon} />
          <span>{document?.title ?? 'Manual del empleado'}</span>
        </div>

        {document?.url ? (
          <div className={styles.manualActions}>
            <a
              className={styles.manualAction}
              href={document.url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLinkIcon className={styles.manualActionIcon} />
              Leer el manual
            </a>
            <a className={styles.manualAction} href={document.url} download>
              <DownloadIcon className={styles.manualActionIcon} />
              Descargar PDF
            </a>
          </div>
        ) : (
          // Sin `storage_ref` no hay nada que leer. Se dice, en vez de mostrar
          // un botón muerto o pedir que confirme la lectura de un documento
          // inexistente.
          <p className={styles.manualPending}>
            RRHH todavía no ha publicado este manual. Avísales antes de confirmar la lectura.
          </p>
        )}
      </div>

      {isCompleted ? (
        <div className={styles.confirmedBanner}>
          <CheckCircledIcon className={styles.confirmedIcon} />
          Lectura confirmada
        </div>
      ) : (
        <>
          {error && (
            <p className={styles.error}>
              {error instanceof Error ? error.message : 'No se pudo confirmar la lectura.'}
            </p>
          )}
          <div className={styles.footer}>
            <Button
              variant="dark"
              disabled={isPending || !document?.url}
              onClick={() => mutate(step.id)}
            >
              {isPending ? 'Confirmando…' : 'He leído y confirmo'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
