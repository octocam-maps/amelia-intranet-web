import {
  CheckCircledIcon,
  ChevronDownIcon,
  DownloadIcon,
  ExternalLinkIcon,
  LockClosedIcon,
  ReaderIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { cn } from '@/lib/utils';
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
 * Con una excepción que `locked`/`acknowledged` no cubren y que sí hay que mirar
 * aquí: un manual AÑADIDO A LA CASCADA DESPUÉS de que alguien cerrase el paso
 * (pasó con el manual de uso de la intranet, migración 045). Para esa persona el
 * documento llega sin confirmar y sin bloquear —la cascada no tiene nada
 * anterior pendiente— pero el paso ya está `completed`, y el POST responde 422
 * ("Este paso ya está completado", `ensure_step_operable`). Ofrecer el botón ahí
 * es exactamente el 422 que este componente promete no provocar, así que el
 * estado del PASO también decide si se puede confirmar.
 *
 * Las `url` son `onboarding_documents.storage_ref` — no se hardcodean: si RRHH
 * publica otra versión de un manual, cambia una fila y esta pantalla la sigue.
 */
export function ManualStep({ step }: ManualStepProps) {
  const { mutate, isPending, variables, error } = useAcknowledgeManual();
  // Manuales que esta persona ha ABIERTO en esta sesión (leer o descargar). No
  // se puede confirmar la lectura de un documento sin haberlo abierto siquiera:
  // el botón salía habilitado nada más llegar al paso, y confirmar sin abrir era
  // un clic.
  //
  // Vive SOLO en el cliente y a propósito: es una ayuda para que el trámite no
  // se haga en automático, no una garantía —nadie puede verificar que se ha
  // leído— y el backend NO lo valida. Por eso se pierde al recargar la página,
  // que es el coste aceptado de no fingir una comprobación que no existe.
  const [openedIds, setOpenedIds] = useState<ReadonlySet<string>>(() => new Set());
  const markOpened = (documentId: string) =>
    setOpenedIds((previous) => new Set(previous).add(documentId));

  // Acordeón: UN manual desplegado a la vez. Con tres manuales abiertos había
  // tres pares de «Leer el manual»/«Descargar PDF» idénticos en pantalla y no se
  // veía cuál tocaba.
  //
  // `undefined` = nadie ha tocado nada todavía, así que manda el valor por
  // defecto (el manual que toca leer). `null` = se cerró a propósito. Sin esa
  // distinción, cerrar el desplegado lo volvería a abrir en el mismo render.
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined);

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
  // Arranca desplegado el que toca leer, no el primero de la lista: si ya
  // confirmaste ClickUp, abrir ClickUp otra vez no te sirve de nada.
  const expandedId = expanded === undefined ? nextPending?.id ?? null : expanded;
  const toggleExpanded = (documentId: string) =>
    setExpanded(expandedId === documentId ? null : documentId);

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

          {/* UN solo contenedor y UN manual desplegado a la vez: cada uno es una
              fila separada por una línea, no una tarjeta con su propia cabecera.
              Con tres manuales, tres cajas con sus acciones repetidas pesaban más
              que su contenido y el paso se leía como si fuesen tres pasos. */}
          <ol className={styles.manualList}>
            {documents.map((document) => (
              <li
                key={document.id}
                className={cn(styles.manualRow, document.locked && styles.manualRowLocked)}
              >
                <ManualRow
                  document={document}
                  stepCompleted={isCompleted}
                  isExpanded={expandedId === document.id}
                  onToggle={() => toggleExpanded(document.id)}
                  isOpened={openedIds.has(document.id)}
                  onOpen={() => markOpened(document.id)}
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

      {/* "Todos" solo si de verdad son todos: con un manual incorporado después
          de cerrar el paso, el texto anterior afirmaba una lectura que no
          consta. */}
      {isCompleted && (
        <div className={styles.confirmedBanner}>
          <CheckCircledIcon className={styles.confirmedIcon} />
          {documents.length > 0 && acknowledgedCount === documents.length
            ? 'Lectura de todos los manuales confirmada'
            : 'Paso completado'}
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

interface ManualRowProps {
  document: OnboardingStepDocument;
  /** El paso ya está cerrado: no admite más confirmaciones (el POST daría 422). */
  stepCompleted: boolean;
  /** Este es el manual desplegado del acordeón. */
  isExpanded: boolean;
  onToggle: () => void;
  /** Se ha abierto (leído o descargado) en esta sesión. */
  isOpened: boolean;
  onOpen: () => void;
  isConfirming: boolean;
  onConfirm: () => void;
}

function ManualRow({
  document,
  stepCompleted,
  isExpanded,
  onToggle,
  isOpened,
  onOpen,
  isConfirming,
  onConfirm,
}: ManualRowProps) {
  const { acknowledged, locked, url } = document;
  // Manual incorporado a la cascada después de que esta persona cerrara el paso.
  const addedAfterCompletion = stepCompleted && !acknowledged;
  const canConfirm = isOpened && !isConfirming;
  const panelId = `${document.id}-panel`;

  return (
    <>
      {/* El disparador del acordeón va dentro de un encabezado y controla su
          panel por `aria-controls`/`aria-expanded` (patrón ARIA de acordeón): así
          un lector de pantalla puede recorrer los manuales como lista de
          encabezados y sabe cuál está desplegado. El paso ya usa `h2`. */}
      <h3 className={styles.manualHeading}>
        <button
          type="button"
          className={styles.manualToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {locked ? (
            <LockClosedIcon className={styles.manualIcon} aria-label="Bloqueado" />
          ) : acknowledged ? (
            <CheckCircledIcon className={styles.manualIconDone} aria-label="Confirmado" />
          ) : (
            <ReaderIcon className={styles.manualIcon} />
          )}
          <span className={styles.manualTitle}>{document.title}</span>
          {acknowledged && <span className={styles.manualBadge}>Confirmado</span>}
          <ChevronDownIcon
            className={cn(styles.manualChevron, isExpanded && styles.manualChevronOpen)}
            aria-hidden
          />
        </button>
      </h3>

      {/* `hidden` en vez de no renderizar: `aria-controls` tiene que apuntar a un
          elemento que exista, y así el navegador puede encontrar texto dentro de
          un panel cerrado con su propia búsqueda. */}
      <div className={styles.manualPanel} id={panelId} hidden={!isExpanded}>
        {/* Un manual bloqueado no ofrece enlaces: si se pudiera abrir y leer, el
            candado solo estorbaría sin proteger nada. */}
        {locked ? (
          <p className={styles.manualNote}>Se desbloquea al confirmar el manual anterior.</p>
        ) : url ? (
          <div className={styles.manualActions}>
          {/* `onOpen` en los DOS: descargar el PDF también es acceder al
              documento, así que ninguno de los dos caminos deja el botón de
              confirmar bloqueado. */}
          {/* El `aria-label` nombra el documento porque el texto visible no puede:
              con tres manuales había tres enlaces «Leer el manual» y tres
              «Descargar PDF» indistinguibles al navegarlos en lista con un lector
              de pantalla (WCAG 2.4.4, el propósito del enlace debe entenderse). */}
          <a
            className={styles.manualAction}
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={onOpen}
            aria-label={`Leer el manual: ${document.title}`}
          >
            <ExternalLinkIcon className={styles.manualActionIcon} />
            Leer el manual
          </a>
          <a
            className={styles.manualAction}
            href={url}
            download
            onClick={onOpen}
            aria-label={`Descargar PDF: ${document.title}`}
          >
            <DownloadIcon className={styles.manualActionIcon} />
            Descargar PDF
          </a>

          {addedAfterCompletion ? (
            <p className={styles.manualNote}>
              Se añadió después de que completaras este paso, así que no tienes que confirmar
              nada.
            </p>
          ) : (
            !acknowledged && (
              <>
                <Button
                  variant="dark"
                  size="sm"
                  disabled={!canConfirm}
                  onClick={onConfirm}
                  // Un `disabled` sin motivo es una puerta cerrada sin cartel.
                  // El aviso va en texto visible y asociado por `aria-describedby`,
                  // no en un `title`: el tooltip no existe en táctil y los
                  // lectores de pantalla no lo anuncian de forma fiable.
                  aria-describedby={isOpened ? undefined : `${document.id}-hint`}
                >
                  {isConfirming ? 'Confirmando…' : 'He leído y confirmo'}
                </Button>
                {!isOpened && (
                  <span className={styles.manualHint} id={`${document.id}-hint`}>
                    Ábrelo para poder confirmar
                  </span>
                )}
              </>
            )
          )}
          </div>
        ) : (
          // Sin `storage_ref` no hay nada que leer. Se dice, en vez de pedir que
          // confirme la lectura de un documento inexistente.
          <p className={styles.manualNote}>
            RRHH todavía no ha publicado este manual. Avísales antes de confirmar la lectura.
          </p>
        )}
      </div>
    </>
  );
}
