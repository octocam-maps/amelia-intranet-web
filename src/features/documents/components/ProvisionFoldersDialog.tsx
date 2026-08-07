import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { usePlanFolders, useProvisionFolders } from '../application/useProvisionFolders';
import type { BulkFolderPlan } from '../domain/models';
import styles from './ProvisionFoldersDialog.module.css';

interface ProvisionFoldersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

/**
 * «Crear carpetas» — organiza el árbol de Drive por entidad.
 *
 * Consulta PRIMERO la pasada en seco (`GET .../plan`, que no escribe nada) y
 * solo lanza el volcado cuando el administrador ha visto lo que va a pasar.
 * El botón directo era más rápido de montar, pero mover una carpeta de sitio
 * no tiene deshacer y hoy solo lo veía quien supiera leer un JSON.
 *
 * Lo que no hace: subir archivos. Crea la estructura vacía, y RRHH deposita
 * después — a mano en Drive o con «Subir documento».
 */
export function ProvisionFoldersDialog({ open, onOpenChange }: ProvisionFoldersDialogProps) {
  const {
    mutate: loadPlan,
    data: plan,
    isPending: isPlanning,
    error: planError,
    reset: resetPlan,
  } = usePlanFolders();
  const {
    mutate: provision,
    data: run,
    isPending: isProvisioning,
    error: provisionError,
    reset: resetRun,
  } = useProvisionFolders();

  useEffect(() => {
    if (open) {
      loadPlan();
    } else {
      // Sin esto, reabrir el diálogo enseñaría el plan de la vez anterior —
      // que puede ser de antes de dar a nadie de alta.
      resetPlan();
      resetRun();
    }
  }, [open, loadPlan, resetPlan, resetRun]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Crear carpetas en Drive</DialogTitle>
          <p className={styles.description}>
            Organiza la carpeta de cada persona bajo su entidad. No sube ningún archivo.
          </p>
        </DialogHeader>

        {run ? (
          <ResultView run={run} />
        ) : isPlanning ? (
          <p className={styles.state}>Comprobando qué falta en Drive…</p>
        ) : planError ? (
          <p className={styles.error}>
            {errorText(planError, 'No se pudo consultar el estado de Drive.')}
          </p>
        ) : plan ? (
          <PlanView plan={plan} />
        ) : null}

        {provisionError && (
          <p className={styles.error}>
            {errorText(provisionError, 'No se pudieron crear las carpetas.')}
          </p>
        )}

        <DialogFooter>
          {run ? (
            <Button variant="dark" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                variant="dark"
                onClick={() => provision()}
                disabled={!plan || isProvisioning || plan.estimatedDriveWrites === 0}
              >
                {isProvisioning ? 'Creando…' : 'Crear carpetas'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanView({ plan }: { plan: BulkFolderPlan }) {
  const moves = plan.entries.filter((entry) => entry.action === 'mover');

  if (plan.estimatedDriveWrites === 0) {
    return <p className={styles.state}>Todo está ya en su sitio. No hay nada que crear.</p>;
  }

  return (
    <div className={styles.body}>
      <dl className={styles.summary}>
        <Row label="Carpetas de empleado nuevas" value={plan.toCreate} />
        <Row label="Carpetas que se moverán" value={plan.toMove} />
        <Row label="Subcarpetas de categoría" value={plan.categoryFoldersToCreate} />
        <Row label="Ya en su sitio" value={plan.alreadyOk} />
        <Row label="Escrituras en Drive" value={plan.estimatedDriveWrites} />
      </dl>

      {plan.entityFoldersToCreate.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>Entidades que se crearán</h3>
          <p className={styles.entities}>{plan.entityFoldersToCreate.join(' · ')}</p>
        </section>
      )}

      {/* Los movimientos van enumerados POR NOMBRE, no como una cifra: es la
          única operación de esta pasada que no se puede deshacer, y «se
          moverá 1» no permite comprobar si ese 1 es quien uno espera. */}
      {moves.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>Se moverán de sitio — conservan todo su contenido</h3>
          <ul className={styles.moveList}>
            {moves.map((entry) => (
              <li key={entry.userId}>
                {entry.email} → {entry.entityName ?? 'raíz'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ResultView({ run }: { run: NonNullable<ReturnType<typeof useProvisionFolders>['data']> }) {
  return (
    <div className={styles.body}>
      <dl className={styles.summary}>
        <Row label="Carpetas creadas" value={run.created} />
        <Row label="Omitidas (ya existían)" value={run.skipped} />
        <Row label="Fallidas" value={run.failed} />
      </dl>
      {/* El batch es best-effort por persona: un fallo puntual no aborta el
          resto. Se arregla volviendo a pulsar el botón, que es idempotente —
          decirlo aquí evita que alguien dé el árbol por roto. */}
      {run.failed > 0 && (
        <p className={styles.state}>
          Puedes volver a pulsar «Crear carpetas»: solo se hará lo que falte.
        </p>
      )}
      {run.errorDetail && <p className={styles.state}>{run.errorDetail}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
