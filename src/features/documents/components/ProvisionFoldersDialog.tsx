import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { ApiError } from '@/lib/http/api-client';
import {
  usePlanFolders,
  useProvisionFolders,
  type ProvisionProgress,
} from '../application/useProvisionFolders';
import type { BulkFolderPlan } from '../domain/models';
import styles from './ProvisionFoldersDialog.module.css';

interface ProvisionFoldersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function errorText(error: unknown, fallback: string): string {
  // El 409 tiene significado propio —«ya hay otro volcado en curso»— y hay que
  // distinguirlo: con un mensaje genérico de error, quien lo ve cree que algo
  // se ha roto y vuelve a intentarlo, que es justo lo contrario de lo que toca.
  if (error instanceof ApiError && error.status === 409) {
    return 'Ya hay un volcado de carpetas en curso. Espera a que termine.';
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * «Crear carpetas» — organiza el árbol de Drive por entidad.
 *
 * Consulta PRIMERO la pasada en seco (que no escribe nada) y solo lanza el
 * volcado cuando el administrador ha visto lo que va a pasar. Mover una carpeta
 * de sitio no tiene deshacer.
 *
 * Luego ejecuta POR LOTES: el servidor procesa unas pocas personas por llamada
 * y dice cuántas quedan. Cerrar el diálogo a mitad no rompe nada — al volver a
 * abrirlo, el plan refleja lo que falta.
 *
 * Lo que no hace: subir archivos. Crea la estructura vacía, y RRHH deposita
 * después.
 */
export function ProvisionFoldersDialog({ open, onOpenChange }: ProvisionFoldersDialogProps) {
  const {
    mutate: loadPlan,
    data: plan,
    isPending: isPlanning,
    error: planError,
    reset: resetPlan,
  } = usePlanFolders();
  const { run, reset: resetRun, progress, isRunning, error: runError } = useProvisionFolders();

  useEffect(() => {
    if (open) {
      loadPlan();
    } else {
      // Sin esto, reabrir el diálogo enseñaría el plan de la vez anterior, que
      // puede ser de antes de dar a alguien de alta.
      resetPlan();
      resetRun();
    }
  }, [open, loadPlan, resetPlan, resetRun]);

  const terminado = progress?.done === true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Crear carpetas en Drive</DialogTitle>
          <p className={styles.description}>
            Organiza la carpeta de cada persona bajo su entidad. No sube ningún archivo.
          </p>
        </DialogHeader>

        {progress ? (
          <ProgressView
            progress={progress}
            total={(plan?.pending ?? 0) + (plan?.alreadyDone ?? 0)}
          />
        ) : isPlanning ? (
          <p className={styles.state}>Comprobando qué falta en Drive…</p>
        ) : planError ? (
          <p className={styles.error}>
            {errorText(planError, 'No se pudo consultar el estado de Drive.')}
          </p>
        ) : plan ? (
          <PlanView plan={plan} />
        ) : null}

        {/* Ternario y no `&&`: `runError` es `unknown` —cualquier cosa puede
            venir de un `catch`— y con `&&` el tipo de la expresión entera pasa
            a ser `unknown`, que no es renderizable. */}
        {runError ? (
          <p className={styles.error}>
            {errorText(runError, 'No se pudieron crear las carpetas.')}
          </p>
        ) : null}

        <DialogFooter>
          {terminado ? (
            <Button variant="dark" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRunning}>
                Cancelar
              </Button>
              <Button
                variant="dark"
                onClick={() => run()}
                disabled={!plan || isRunning || plan.pending === 0}
              >
                {isRunning ? 'Creando…' : 'Crear carpetas'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanView({ plan }: { plan: BulkFolderPlan }) {
  const moves = plan.entries.filter(
    (entry) => entry.action === 'mover' || entry.action === 'recolocar'
  );

  if (plan.pending === 0) {
    return <p className={styles.state}>Todo está ya en su sitio. No hay nada que crear.</p>;
  }

  return (
    <div className={styles.body}>
      <dl className={styles.summary}>
        <Row label="Personas pendientes" value={plan.pending} />
        <Row label="Ya en su sitio" value={plan.alreadyDone} />
        <Row label="Carpetas nuevas" value={plan.toCreate} />
        <Row label="Carpetas que se moverán" value={plan.toMove} />
        <Row label="Escrituras en Drive" value={plan.estimatedDriveWrites} />
      </dl>

      {plan.entityFoldersToCreate.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>Entidades que se crearán</h3>
          <p className={styles.entities}>{plan.entityFoldersToCreate.join(' · ')}</p>
        </section>
      )}

      {/* Los movimientos van enumerados POR NOMBRE, no como una cifra: son la
          única operación que no se puede deshacer, y «se moverá 1» no permite
          comprobar si ese 1 es quien uno espera. */}
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

function ProgressView({ progress, total }: { progress: ProvisionProgress; total: number }) {
  const hechas = Math.max(0, total - progress.remaining);
  const porcentaje = total > 0 ? Math.round((hechas / total) * 100) : 100;

  return (
    <div className={styles.body}>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={hechas}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Progreso del volcado de carpetas"
      >
        <div className={styles.progressFill} style={{ width: `${porcentaje}%` }} />
      </div>
      <p className={styles.state}>
        {hechas} de {total} carpetas listas
      </p>

      <dl className={styles.summary}>
        <Row label="Creadas" value={progress.created} />
        <Row label="Recolocadas" value={progress.relocated} />
      </dl>

      {/* El bucle para cuando `remaining` deja de bajar. Eso NO es un error de
          la aplicación: son personas concretas que Drive rechaza, y lo
          accionable es saber cuántas para ir a mirar sus logs. */}
      {progress.done && progress.stuck > 0 && (
        <p className={styles.error}>
          {progress.stuck} carpeta(s) no se han podido crear. Vuelve a intentarlo más tarde; si
          persiste, hay que revisar el registro del servidor.
        </p>
      )}
      {progress.done && progress.stuck === 0 && (
        <p className={styles.state}>Listo: todas las carpetas están en su sitio.</p>
      )}
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
