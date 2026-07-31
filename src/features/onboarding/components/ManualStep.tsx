import {
  CheckCircledIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LockClosedIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { useAcknowledgeManual } from '../application/useAcknowledgeManual';
import type { OnboardingStep, OnboardingStepDocument } from '../domain/models';
import styles from './ManualStep.module.css';

interface ManualStepProps {
  step: OnboardingStep;
}

/**
 * Lectura de los manuales de referencia. Desde la reordenación de v1.1 es el
 * paso 3 y actúa de PUERTA: hasta confirmar la lectura, el trabajador no llega
 * al perfil ni a la documentación que tiene que firmar y subir.
 *
 * MULTI-MANUAL EN CASCADA (migración backend 040): el paso trae VARIOS manuales
 * en `step.documents`, con un orden de lectura. Solo el primero pendiente está
 * abierto; el resto llega con `locked: true` y se pinta con candado. El paso no
 * se completa hasta confirmarlos todos (RF-A6.3).
 *
 * `locked` y `acknowledged` los decide el BACKEND, con la misma regla que valida
 * el POST de confirmación. Aquí NO se recalculan: si el candado saliera de un
 * sitio y el rechazo de otro, acabarían discrepando y el trabajador vería un
 * botón habilitado que devuelve 422.
 *
 * Las `url` son `onboarding_documents.storage_ref` — no se hardcodean: si RRHH
 * publica otra versión de un manual, cambia una fila y esta pantalla la sigue.
 */
export function ManualStep({ step }: ManualStepProps) {
  const { mutate, isPending, variables, error } = useAcknowledgeManual();

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';
  const documents = step.documents;

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear los manuales.</p>
      </div>
    );
  }

  const acknowledgedCount = documents.filter((document) => document.acknowledged).length;
  // El primero pendiente y no bloqueado: el único que se puede confirmar ahora.
  const nextPending = documents.find((document) => !document.acknowledged && !document.locked);

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <p className={styles.subtitle}>
        {documents.length > 1
          ? 'Lee los manuales en orden y confirma cada uno. Podrás volver a consultarlos cuando quieras.'
          : 'Lee el manual y confirma la lectura para continuar. Podrás volver a consultarlo cuando quieras.'}
      </p>

      {documents.length === 0 ? (
        // Sin manuales configurados no hay nada que leer ni que confirmar. Se
        // dice, en vez de mostrar un botón muerto.
        <p className={styles.manualPending}>
          RRHH todavía no ha publicado los manuales de este paso. Avísales para poder continuar.
        </p>
      ) : (
        <>
          {documents.length > 1 && (
            <p className={styles.progress}>
              {acknowledgedCount} de {documents.length} manuales confirmados
            </p>
          )}

          <ol className={styles.manualList}>
            {documents.map((document) => (
              <li key={document.id}>
                <ManualCard
                  document={document}
                  stepId={step.id}
                  isConfirming={isPending && variables?.documentId === document.id}
                  onConfirm={() => mutate({ stepId: step.id, documentId: document.id })}
                />
              </li>
            ))}
          </ol>

          {/* El mensaje de la puerta: explica POR QUÉ el resto está bloqueado,
              en vez de dejar candados sin motivo. */}
          {nextPending && documents.some((document) => document.locked) && (
            <p className={styles.gateHint}>
              Lee «{nextPending.title}» para desbloquear el resto de la documentación.
            </p>
          )}
        </>
      )}

      {isCompleted && (
        <div className={styles.confirmedBanner}>
          <CheckCircledIcon className={styles.confirmedIcon} />
          Lectura de todos los manuales confirmada
        </div>
      )}

      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo confirmar la lectura.'}
        </p>
      )}
    </div>
  );
}

interface ManualCardProps {
  document: OnboardingStepDocument;
  stepId: string;
  isConfirming: boolean;
  onConfirm: () => void;
}

function ManualCard({ document, isConfirming, onConfirm }: ManualCardProps) {
  const { acknowledged, locked, url } = document;

  return (
    <div className={locked ? `${styles.manualCard} ${styles.manualCardLocked}` : styles.manualCard}>
      <div className={styles.manualHeader}>
        {locked ? (
          <LockClosedIcon className={styles.manualIcon} aria-label="Bloqueado" />
        ) : acknowledged ? (
          <CheckCircledIcon className={styles.manualIconDone} aria-label="Confirmado" />
        ) : (
          <ReaderIcon className={styles.manualIcon} />
        )}
        <span className={styles.manualTitle}>{document.title}</span>
        {acknowledged && <span className={styles.manualBadge}>Confirmado</span>}
      </div>

      {/* Un manual bloqueado no ofrece enlaces: si se pudiera abrir y leer, el
          candado solo estorbaría sin proteger nada. */}
      {locked ? (
        <p className={styles.manualPending}>Se desbloquea al confirmar el manual anterior.</p>
      ) : url ? (
        <>
          <div className={styles.manualActions}>
            <a className={styles.manualAction} href={url} target="_blank" rel="noreferrer">
              <ExternalLinkIcon className={styles.manualActionIcon} />
              Leer el manual
            </a>
            <a className={styles.manualAction} href={url} download>
              <DownloadIcon className={styles.manualActionIcon} />
              Descargar PDF
            </a>
          </div>
          {!acknowledged && (
            <div className={styles.footer}>
              <Button variant="dark" disabled={isConfirming} onClick={onConfirm}>
                {isConfirming ? 'Confirmando…' : 'He leído y confirmo'}
              </Button>
            </div>
          )}
        </>
      ) : (
        // Sin `storage_ref` no hay nada que leer. Se dice, en vez de pedir que
        // confirme la lectura de un documento inexistente.
        <p className={styles.manualPending}>
          RRHH todavía no ha publicado este manual. Avísales antes de confirmar la lectura.
        </p>
      )}
    </div>
  );
}
